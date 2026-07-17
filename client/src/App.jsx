import { useEffect, useMemo, useState } from 'react';
import NoteForm from './components/NoteForm';
import NoteCard from './components/NoteCard';

const NOTES_API_URL = 'https://jsonplaceholder.typicode.com/posts?_limit=6';

export default function App() {
  const [notes, setNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

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
        const normalizedNotes = Array.isArray(data)
          ? data.map((item) => ({
              id: item.id,
              title: item.title,
              subject: `Subject ${item.userId ?? 1}`,
              content: item.body,
            }))
          : [];

        setNotes(normalizedNotes);
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

  const handleAddNote = (newNote) => {
    setNotes((currentNotes) => [
      {
        id: Date.now(),
        ...newNote,
      },
      ...currentNotes,
    ]);
  };

  const handleDeleteNote = (noteId) => {
    setNotes((currentNotes) => currentNotes.filter((note) => note.id !== noteId));
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
                <NoteCard key={note.id} note={note} onDelete={handleDeleteNote} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
