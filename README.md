# StudyMate

StudyMate is a notes-focused learning project with three parts:

- A static marketing landing page in `landing/`
- A React + Vite notes frontend in `client/`
- An Express + MongoDB API in `server/`

The app lets users create, search, delete, and summarize notes. AI summarization uses Groq and returns a 3 bullet-point summary plus 1 quiz question.

## Features

- Responsive marketing landing page with hero and feature cards
- React notes UI with controlled add-note form
- Client-side search by title or subject
- Delete note support
- AI summarize action for each note
- Backend API with MongoDB persistence and a fallback in-memory mode when the database is unavailable

## Project Structure

```text
studymate/
├─ landing/   # Static HTML/CSS/JS landing page
├─ client/    # React + Vite frontend
├─ server/    # Express + MongoDB API
├─ mcp-server/
└─ README.md
```

## Prerequisites

- Node.js 18+ recommended
- npm
- MongoDB Atlas or local MongoDB for persistence
- A Groq API key for AI summarization

## Environment Variables

### `server/.env`

```dotenv
PORT=5000
MONGODB_URI=mongodb://localhost:27017/studymate
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama3-8b-8192
```

### Optional `client/.env`

If your frontend is running on a different port than the backend, you can point it at the API:

```dotenv
VITE_API_BASE_URL=http://localhost:5000
```

## Install

Install dependencies separately for the backend and frontend:

```bash
cd server
npm install

cd ../client
npm install
```

## Run the Backend

```bash
cd server
npm start
```

The API exposes these routes:

- `GET /api/notes` - fetch all notes
- `POST /api/notes` - create a note
- `DELETE /api/notes/:id` - delete a note
- `POST /api/notes/:id/summarize` - summarize a note with Groq

If MongoDB is unreachable, the server may start in memory mode so the app can still run, but data will not persist.

## Run the React App

```bash
cd client
npm run dev
```

The React app loads notes from the backend, supports add/delete/search, and shows AI summaries and quiz questions on each note card.

## Run the Landing Page

Open `landing/index.html` directly in a browser, or serve the `landing/` folder with any static file server.

## AI Summarization Flow

- The backend reads the note content
- The Groq client is created in `server/lib/openai.js`
- The model is prompted for:
	- 3 bullet-point summary
	- 1 quiz question
- The response is saved back into the note document as `summary` and `quizQuestion`

## Notes

- The frontend expects note documents to include `_id`, `title`, `subject`, `content`, `summary`, and `quizQuestion`
- The summarize button on each note shows a loading state while the request is running
- The backend validates that `title` and `content` are not empty before creating a note

## Troubleshooting

- If the backend cannot connect to MongoDB Atlas, check your connection string, IP allowlist, and network access
- If summarization fails, confirm `GROQ_API_KEY` is set in `server/.env`
- If the frontend cannot reach the API, verify `VITE_API_BASE_URL` and the backend port
