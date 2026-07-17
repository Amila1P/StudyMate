export default function NoteCard({ note, onDelete }) {
  return (
    <article className="note-card">
      <div className="note-card__meta">
        <span>{note.subject}</span>
        <button type="button" className="delete-button" onClick={() => onDelete(note.id)}>
          Delete
        </button>
      </div>
      <h3>{note.title}</h3>
      <p>{note.content}</p>
    </article>
  );
}
