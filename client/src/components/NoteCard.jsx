export default function NoteCard({ note, onDelete, onSummarize, isSummarizing }) {
  return (
    <article className="note-card">
      <div className="note-card__meta">
        <span>{note.subject}</span>
        <div className="note-card__actions">
          <button
            type="button"
            className="summarize-button"
            onClick={() => onSummarize(note._id)}
            disabled={isSummarizing}
          >
            {isSummarizing ? 'Summarizing...' : '✨ Summarize'}
          </button>
          <button type="button" className="delete-button" onClick={() => onDelete(note._id)}>
            Delete
          </button>
        </div>
      </div>
      <h3>{note.title}</h3>
      <p>{note.content}</p>

      {Array.isArray(note.summary) && note.summary.length > 0 ? (
        <div className="note-ai-block">
          <h4>AI Summary</h4>
          <ul>
            {note.summary.map((item, index) => (
              <li key={`${note._id}-summary-${index}`}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {note.quizQuestion ? (
        <div className="note-ai-block quiz-block">
          <h4>Quiz Question</h4>
          <p>{note.quizQuestion}</p>
        </div>
      ) : null}
    </article>
  );
}
