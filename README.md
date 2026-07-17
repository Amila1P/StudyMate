# StudyMate

StudyMate is a full-stack study companion for creating, organizing, searching, deleting, and summarizing notes. It includes a static landing page, a React notes app, an Express + MongoDB backend, a Groq-powered AI summarizer, and a local MCP server for Claude Desktop.

## Tech Stack

- Frontend: React, Vite, Vanilla CSS, Vanilla JavaScript
- Backend: Node.js, Express, Mongoose, MongoDB
- AI Summarization: Groq API, `groq-sdk`
- MCP: `@modelcontextprotocol/sdk`, stdio transport
- Tooling: npm, dotenv, CORS

## Project Structure

```text
studymate/
├─ landing/      # Static marketing landing page
├─ client/       # React + Vite frontend
├─ server/       # Express + MongoDB API
├─ mcp-server/   # Local MCP server for Claude Desktop
└─ README.md
```

## Setup Steps

### Server

1. Open a terminal in the `server/` folder.
2. Install dependencies:

	```bash
	npm install
	```

3. Create a `.env` file in `server/` using the variables shown in the [Environment Variables](#environment-variables) section.
4. Start the API:

	```bash
	npm start
	```

The backend exposes the note API, Groq summarization route, and MongoDB connection logic.

### Client

1. Open a terminal in the `client/` folder.
2. Install dependencies:

	```bash
	npm install
	```

3. If needed, create `client/.env` and set `VITE_API_BASE_URL=http://localhost:5000`.
4. Start the frontend:

	```bash
	npm run dev
	```

The React app loads notes from the backend, supports create/delete/search, and shows AI summaries and quiz questions for each note.

### MCP Server

1. Open a terminal in the `mcp-server/` folder.
2. Install dependencies:

	```bash
	npm install
	```

3. Make sure `server/.env` contains the same `MONGODB_URI` used by the backend.
4. Start the local MCP server:

	```bash
	npm start
	```

The MCP server uses stdio and provides two tools: `list_notes` and `create_note`.

## Environment Variables

Use `server/.env.example` as the template for your backend environment file.

### `server/.env`

```dotenv
PORT=5000
MONGODB_URI=mongodb://localhost:27017/studymate
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama3-8b-8192
```

### Variable Details

- `PORT` - Backend port for the Express API
- `MONGODB_URI` - MongoDB connection string for Atlas or local MongoDB
- `GROQ_API_KEY` - API key used by the AI summarization helper
- `GROQ_MODEL` - Groq model name for summarization requests
- `VITE_API_BASE_URL` - Optional frontend API base URL if the client is not using the default backend address

## Screenshots

Add your final screenshots in a `docs/screenshots/` folder or any folder you prefer, then update the placeholders below.

### App UI

![App UI placeholder](./docs/screenshots/app-ui.png)

### AI Feature: Summarization Result

![AI summarization placeholder](./docs/screenshots/ai-summarization.png)

### MCP Tool Call: Claude Desktop Interaction

![MCP tool call placeholder](./docs/screenshots/mcp-tool-call.png)

## Claude Desktop MCP Configuration

Add StudyMate to `claude_desktop_config.json` so Claude Desktop can start the local MCP server:

```json
{
  "mcpServers": {
	 "studymate": {
		"command": "node",
		"args": ["D:/---AMILA---/Projects/AcademyDSJ/Final_Assignment/studymate/mcp-server/index.js"],
		"env": {
		  "MONGODB_URI": "mongodb://localhost:27017/studymate"
		}
	 }
  }
}
```

If your MongoDB connection string is different, update the `env` value to match the same database used by the backend.

## Notes

- The backend can start in a fallback in-memory mode if MongoDB is unavailable, but data will not persist.
- The frontend expects note documents to include `_id`, `title`, `subject`, `content`, `summary`, and `quizQuestion`.
- The AI summary action returns a 3 bullet-point summary and 1 quiz question.

## Run Summary

- Server: `cd server && npm start`
- Client: `cd client && npm run dev`
- MCP Server: `cd mcp-server && npm start`
