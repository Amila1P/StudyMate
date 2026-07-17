import { useEffect, useMemo, useState } from 'react';
import NoteForm from './components/NoteForm';
import NoteCard from './components/NoteCard';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const NOTES_API_URL = `${API_BASE_URL}/api/notes`;

export default function App() {
  const [notes, setNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [summarizingNoteId, setSummarizingNoteId] = useState(null);

  useEffect(() => {
    const loadNotes = async () => {
      setLoading(true);
      setErrorMessage('');

      try {
        const response = await fetch(NOTES_API_URL);
        if (!response.ok) {
          throw new Error('Failed to load notes');
        }

        const data = await response.json();
        setNotes(Array.isArray(data) ? data : []);
      } catch (error) {
        setErrorMessage('Unable to load notes right now.');
        setNotes([]);
      } finally {
        setLoading(false);
      }
    };

    loadNotes();
  }, []);

  const filteredNotes = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return notes;
    }

    return notes.filter((note) => {
      return (
        note.title.toLowerCase().includes(query) ||
        note.subject.toLowerCase().includes(query)
      );
    });
  }, [notes, searchTerm]);

  const handleAddNote = async (newNote) => {
    try {
      const response = await fetch(NOTES_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newNote),
      });

      if (!response.ok) {
        throw new Error('Failed to create note');
      }

      const createdNote = await response.json();
      setNotes((currentNotes) => [createdNote, ...currentNotes]);
    } catch (error) {
      setErrorMessage('Unable to add note right now.');
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      const response = await fetch(`${NOTES_API_URL}/${noteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }

      setNotes((currentNotes) => currentNotes.filter((note) => note._id !== noteId));
    } catch (error) {
      setErrorMessage('Unable to delete note right now.');
    }
  };

  const handleSummarizeNote = async (noteId) => {
    setSummarizingNoteId(noteId);

    try {
      const response = await fetch(`${NOTES_API_URL}/${noteId}/summarize`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to summarize note');
      }

      const updatedNote = await response.json();

      setNotes((currentNotes) =>
        currentNotes.map((note) => (note._id === noteId ? updatedNote : note)),
      );
    } catch (error) {
      setErrorMessage('Unable to summarize note right now.');
    } finally {
      setSummarizingNoteId(null);
    }
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-copy">
          <span className="eyebrow">StudyMate</span>
          <h1>Organize notes, stay focused, and study smarter.</h1>
          <p>
            Capture lecture ideas, search your collection fast, and keep your study flow in one clean place.
          </p>
        </div>
      </header>

      <main className="content-grid">
        <section className="panel form-panel">
          <h2>Add a Note</h2>
          <NoteForm onAddNote={handleAddNote} />
        </section>

        <section className="panel notes-panel">
          <div className="notes-header">
            <div>
              <h2>Your Notes</h2>
              <p>Search by title or subject.</p>
            </div>
            <label className="search-box">
              <span className="search-label">Search</span>
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search notes"
              />
            </label>
          </div>

          {loading ? (
            <div className="state-message">Loading notes...</div>
          ) : errorMessage ? (
            <div className="state-message error">{errorMessage}</div>
          ) : filteredNotes.length === 0 ? (
            <div className="state-message">No notes yet — add your first one!</div>
          ) : (
            <div className="notes-list">
              {filteredNotes.map((note) => (
                <NoteCard
                  key={note._id}
                  note={note}
                  onDelete={handleDeleteNote}
                  onSummarize={handleSummarizeNote}
                  isSummarizing={summarizingNoteId === note._id}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
