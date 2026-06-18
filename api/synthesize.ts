// Vercel serverless function: turns rough, conversational notes about a set of
// generative-image prompt experiments into a structured academic white paper.
//
// Uses the Claude Messages API with a JSON-schema output format so the response
// is always a parseable { title, abstract, synthesis } object. Set the
// ANTHROPIC_API_KEY environment variable (Vercel project settings) to enable it;
// the model is overridable via SYNTHESIZE_MODEL.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';

const MODEL = process.env.SYNTHESIZE_MODEL || 'claude-opus-4-8';

const SYSTEM = `You are an academic writing assistant for a generative-image research course.
A student gives you rough, conversational notes describing what they made, how their
prompts evolved, what they tried, and what they learned. Reformulate those notes into a
structured white paper.

Rules:
- Write in the same language as the student's notes (e.g. German notes -> German output).
- "abstract": one concise paragraph (3-5 sentences) summarising the work.
- "synthesis": the body as GitHub-flavoured Markdown. Use "## " section headings
  (e.g. Methodology, Findings, Reflection — translated to the notes' language). Use
  short paragraphs, bullet lists, and an occasional blockquote where it fits. Do NOT
  include a top-level title heading or an abstract inside the synthesis.
- "title": a short, specific paper title. If the notes already imply one, use it.
- Stay faithful to the notes; do not invent results that were not described.`;

const SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Short, specific paper title.' },
    abstract: { type: 'string', description: 'One concise summary paragraph.' },
    synthesis: {
      type: 'string',
      description: 'The paper body as GitHub-flavoured Markdown with ## section headings.',
    },
  },
  required: ['title', 'abstract', 'synthesis'],
  additionalProperties: false,
} as const;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST.' });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res
      .status(503)
      .json({ error: 'Synthesis is not configured. Set ANTHROPIC_API_KEY to enable it.' });
  }

  const rough = typeof req.body?.rough === 'string' ? req.body.rough.trim() : '';
  if (rough.length < 10) {
    return res.status(400).json({ error: 'Provide a few sentences of notes to synthesize.' });
  }

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system: SYSTEM,
      output_config: { format: { type: 'json_schema', schema: SCHEMA } },
      messages: [{ role: 'user', content: rough }],
    });

    const text = response.content.find((b) => b.type === 'text');
    if (!text || text.type !== 'text') {
      return res.status(502).json({ error: 'No content returned from the model.' });
    }
    const parsed = JSON.parse(text.text) as {
      title: string;
      abstract: string;
      synthesis: string;
    };
    return res.status(200).json(parsed);
  } catch (e) {
    return res
      .status(502)
      .json({ error: e instanceof Error ? e.message : 'Synthesis failed.' });
  }
}
