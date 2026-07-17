const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

dotenv.config({ path: path.join(__dirname, '..', 'server', '.env') });

const Note = require('../server/models/Note');

const MONGODB_URI = process.env.MONGODB_URI;

async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is missing. Set it in server/.env before starting the MCP server.');
  }

  if (mongoose.connection.readyState === 1) {
    return;
  }

  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
    maxPoolSize: 10,
  });
}

const server = new McpServer({
  name: 'studymate-mcp',
  version: '1.0.0',
});

server.tool(
  'list_notes',
  'Fetch all notes from the StudyMate database.',
  {
    type: 'object',
    properties: {},
    additionalProperties: false,
  },
  async () => {
    await connectToDatabase();

    const notes = await Note.find().sort({ createdAt: -1 }).lean();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ notes }, null, 2),
        },
      ],
    };
  },
);

server.tool(
  'create_note',
  'Create a new StudyMate note in MongoDB.',
  {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        minLength: 1,
        description: 'The note title.',
      },
      subject: {
        type: 'string',
        description: 'The note subject.',
      },
      content: {
        type: 'string',
        minLength: 1,
        description: 'The note content.',
      },
    },
    required: ['title', 'content'],
    additionalProperties: false,
  },
  async ({ title, subject = '', content }) => {
    await connectToDatabase();

    const trimmedTitle = title.trim();
    const trimmedSubject = typeof subject === 'string' ? subject.trim() : '';
    const trimmedContent = content.trim();

    if (!trimmedTitle || !trimmedContent) {
      throw new Error('title and content are required');
    }

    const note = await Note.create({
      title: trimmedTitle,
      subject: trimmedSubject,
      content: trimmedContent,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ note }, null, 2),
        },
      ],
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('[MCP] Failed to start StudyMate MCP server:', error);
  process.exit(1);
});