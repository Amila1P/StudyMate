import { useState } from 'react';

const initialFormState = {
  title: '',
  subject: '',
  content: '',
};

export default function NoteForm({ onAddNote }) {
  const [formData, setFormData] = useState(initialFormState);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedTitle = formData.title.trim();
    const trimmedSubject = formData.subject.trim();
    const trimmedContent = formData.content.trim();

    if (!trimmedTitle || !trimmedSubject || !trimmedContent) {
      return;
    }

    onAddNote({
      title: trimmedTitle,
      subject: trimmedSubject,
      content: trimmedContent,
    });

    setFormData(initialFormState);
  };

  return (
    <form className="note-form" onSubmit={handleSubmit}>
      <label>
        Title
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Enter note title"
        />
      </label>

      <label>
        Subject
        <input
          type="text"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          placeholder="Enter subject"
        />
      </label>

      <label>
        Content
        <textarea
          name="content"
          value={formData.content}
          onChange={handleChange}
          placeholder="Write your note"
          rows="6"
        />
      </label>

      <button type="submit">Add Note</button>
    </form>
  );
}
