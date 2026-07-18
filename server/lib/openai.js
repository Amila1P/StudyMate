const Groq = require('groq-sdk');

const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-20b';

function resolveGroqModel() {
  const configuredModel = process.env.GROQ_MODEL?.trim();

  if (!configuredModel || configuredModel === 'llama3-8b-8192') {
    return DEFAULT_GROQ_MODEL;
  }

  return configuredModel;
}

function createAiClient() {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('Missing GROQ_API_KEY in the environment.');
  }

  return new Groq({ apiKey });
}

async function generateNoteSummary(noteContent) {
  const client = createAiClient();
  const model = resolveGroqModel();

  const completion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content:
          'You summarize study notes. Return only valid JSON with this exact shape: {"summary":["bullet 1","bullet 2","bullet 3"],"quizQuestion":"one quiz question"}.',
      },
      {
        role: 'user',
        content: `Create a 3 bullet-point summary + 1 quiz question about the note below.\n\nNote:\n${noteContent}`,
      },
    ],
  });

  const rawText = completion.choices?.[0]?.message?.content || '';

  try {
    const parsed = JSON.parse(rawText);
    const summary = Array.isArray(parsed.summary) ? parsed.summary.slice(0, 3).map(String) : [];
    const quizQuestion = typeof parsed.quizQuestion === 'string' ? parsed.quizQuestion.trim() : '';

    if (summary.length !== 3 || !quizQuestion) {
      throw new Error('Groq response did not contain the expected summary and quiz question.');
    }

    return { summary, quizQuestion };
  } catch (parseError) {
    const fallbackLines = rawText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const summary = fallbackLines.slice(0, 3);
    const quizQuestion = fallbackLines[3] || 'What is the main idea of this note?';

    if (summary.length < 3) {
      throw new Error('Unable to parse AI response into a summary.');
    }

    return { summary, quizQuestion };
  }
}

module.exports = { generateNoteSummary };