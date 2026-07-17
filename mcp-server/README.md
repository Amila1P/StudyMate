# StudyMate MCP Server

This folder contains the local stdio MCP server for StudyMate.

## Tools

- `list_notes` - fetch all notes from MongoDB
- `create_note` - create a new note with `title`, `subject`, and `content`

## Install

```bash
cd mcp-server
npm install
```

The server reads `MONGODB_URI` from `server/.env`.

## Run

```bash
cd mcp-server
npm start
```

## Claude Desktop

Add the server to `claude_desktop_config.json` using a command entry that points to `mcp-server/index.js`.