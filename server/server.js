const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const Note = require('./models/Note');
const { generateNoteSummary } = require('./lib/openai');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const memoryNotes = [];
let useMemoryStore = false;

function buildDirectAtlasUri(uri) {
	if (!uri || !uri.startsWith('mongodb+srv://')) {
		return null;
	}

	try {
		const parsedUri = new URL(uri);
		const databaseName = parsedUri.pathname && parsedUri.pathname !== '/' ? parsedUri.pathname : '/studymate';
		const clusterPrefix = parsedUri.hostname.split('.')[0];
		const clusterDomain = parsedUri.hostname.split('.').slice(1).join('.');
		const username = parsedUri.username ? decodeURIComponent(parsedUri.username) : '';
		const password = parsedUri.password ? decodeURIComponent(parsedUri.password) : '';
		const authPart = username ? `${encodeURIComponent(username)}:${encodeURIComponent(password)}@` : '';
		const query = new URLSearchParams(parsedUri.searchParams);
		const replicaHosts = [0, 1, 2].map((index) => `${clusterPrefix}-shard-00-0${index}.${clusterDomain}:27017`).join(',');

		query.delete('appName');
		query.set('authSource', 'admin');
		query.set('retryWrites', 'true');
		query.set('w', 'majority');
		query.set('tls', 'true');

		return `mongodb://${authPart}${replicaHosts}${databaseName}?${query.toString()}`;
	} catch (error) {
		return null;
	}
}

function logMongoConnectionError(error) {
	const message = error?.message || 'Unknown MongoDB connection error.';
	const errorName = error?.name || 'MongoError';
	const errorCode = error?.code;
	const causeMessage = error?.cause?.message;

	if (/authentication failed|bad auth|not authorized|Authentication failed/i.test(message)) {
		console.error(`[MongoDB] Authentication error: ${message}`);
		if (causeMessage) {
			console.error('[MongoDB] Cause:', causeMessage);
		}
		return;
	}

	if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|network error|server selection timed out|getaddrinfo|querySrv/i.test(message)) {
		console.error(`[MongoDB] Network/DNS error${errorCode ? ` (${errorCode})` : ''}: ${message}`);
		if (causeMessage) {
			console.error('[MongoDB] Cause:', causeMessage);
		}
		return;
	}

	console.error(`[MongoDB] ${errorName}${errorCode ? ` (${errorCode})` : ''}: ${message}`);

	if (error?.reason) {
		console.error('[MongoDB] Topology reason:', error.reason);
	}

	if (causeMessage) {
		console.error('[MongoDB] Cause:', causeMessage);
	}
}

app.use(cors());
app.use(express.json());

async function connectToDatabase() {
	if (!MONGODB_URI) {
		useMemoryStore = true;
		console.warn('[MongoDB] MONGODB_URI is missing. Using in-memory notes store.');
		return;
	}

	const connectionOptions = {
		serverSelectionTimeoutMS: 15000,
		connectTimeoutMS: 15000,
		maxPoolSize: 10,
	};

	// These legacy options are no longer required in Mongoose 9, but keeping them is harmless
	// when the installed version still accepts them.
	if (mongoose.version && Number.parseInt(mongoose.version.split('.')[0], 10) < 7) {
		connectionOptions.useNewUrlParser = true;
		connectionOptions.useUnifiedTopology = true;
	}

	mongoose.connection.on('error', (error) => {
		logMongoConnectionError(error);
	});

	mongoose.connection.on('disconnected', () => {
		console.warn('[MongoDB] Connection lost.');
	});

	try {
		await mongoose.connect(MONGODB_URI, connectionOptions);
		console.log('[MongoDB] Connected successfully using the primary URI.');
		return;
	} catch (primaryError) {
		logMongoConnectionError(primaryError);
	}

	const directUri = buildDirectAtlasUri(MONGODB_URI);

	if (!directUri) {
		throw new Error('Unable to build a direct Atlas fallback URI from MONGODB_URI.');
	}

	console.warn('[MongoDB] Trying direct Atlas host fallback URI...');

	try {
		await mongoose.connect(directUri, connectionOptions);
		console.log('[MongoDB] Connected successfully using the direct Atlas fallback URI.');
	} catch (fallbackError) {
		logMongoConnectionError(fallbackError);
		useMemoryStore = true;
		console.warn('[MongoDB] Falling back to an in-memory notes store so the app can start.');
	}
}

app.get('/api/notes', async (request, response) => {
	try {
		if (useMemoryStore) {
			return response.json([...memoryNotes].sort((firstNote, secondNote) => new Date(secondNote.createdAt) - new Date(firstNote.createdAt)));
		}

		const notes = await Note.find().sort({ createdAt: -1 });
		response.json(notes);
	} catch (error) {
		response.status(500).json({ error: 'Failed to fetch notes.' });
	}
});

app.post('/api/notes', async (request, response) => {
	try {
		const { title, subject, content } = request.body;

		if (!title || !content || !title.trim() || !content.trim()) {
			return response.status(400).json({ error: 'Title and content are required.' });
		}

		if (useMemoryStore) {
			const note = {
				_id: `${Date.now()}`,
				title: title.trim(),
				subject: subject ? subject.trim() : '',
				content: content.trim(),
				summary: [],
				quizQuestion: '',
				createdAt: new Date(),
			};

			memoryNotes.unshift(note);
			return response.status(201).json(note);
		}

		const note = await Note.create({
			title: title.trim(),
			subject: subject ? subject.trim() : '',
			content: content.trim(),
		});

		response.status(201).json(note);
	} catch (error) {
		response.status(500).json({ error: 'Failed to create note.' });
	}
});

app.delete('/api/notes/:id', async (request, response) => {
	try {
		if (useMemoryStore) {
			const noteIndex = memoryNotes.findIndex((note) => note._id === request.params.id);

			if (noteIndex === -1) {
				return response.status(404).json({ error: 'Note not found.' });
			}

			memoryNotes.splice(noteIndex, 1);
			return response.json({ message: 'Note deleted successfully.' });
		}

		const deletedNote = await Note.findByIdAndDelete(request.params.id);

		if (!deletedNote) {
			return response.status(404).json({ error: 'Note not found.' });
		}

		response.json({ message: 'Note deleted successfully.' });
	} catch (error) {
		response.status(500).json({ error: 'Failed to delete note.' });
	}
});

app.post('/api/notes/:id/summarize', async (request, response) => {
	try {
		if (useMemoryStore) {
			const note = memoryNotes.find((entry) => entry._id === request.params.id);

			if (!note) {
				return response.status(404).json({ error: 'Note not found.' });
			}

			const aiResult = await generateNoteSummary(note.content);
			note.summary = aiResult.summary;
			note.quizQuestion = aiResult.quizQuestion;
			return response.json(note);
		}

		const note = await Note.findById(request.params.id);

		if (!note) {
			return response.status(404).json({ error: 'Note not found.' });
		}

		if (!note.content || !note.content.trim()) {
			return response.status(400).json({ error: 'Note content is empty.' });
		}

		const aiResult = await generateNoteSummary(note.content);

		note.summary = aiResult.summary;
		note.quizQuestion = aiResult.quizQuestion;
		await note.save();

		response.json(note);
	} catch (error) {
		console.error('[Summarize] Failed to summarize note:', error?.message || error);
		response.status(500).json({ error: 'Failed to summarize note.' });
	}
});

app.get('/health', (request, response) => {
	response.json({ status: 'ok', mode: useMemoryStore ? 'memory' : (mongoose.connection.readyState === 1 ? 'mongodb' : 'disconnected') });
});

connectToDatabase()
	.then(() => {
		app.listen(PORT, () => {
			console.log(`StudyMate API running on port ${PORT}`);
		});
	})
	.catch((error) => {
		console.error('Failed to start server:', error.message);
		process.exit(1);
	});
