/**
 * Code Generation Service
 *
 * Priority:
 *  1. Fine-tuned HF model  (if VITE_HF_API_KEY + VITE_HF_MODEL are set)
 *  2. Groq Llama 3.3 70B   (fallback — always available)
 */

import Groq from 'groq-sdk';
import { isHFConfigured, generateWithHF, improveWithHF } from './hfModel';

const client = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

const MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are a code generation assistant. Given a natural language description of a UI component, generate valid, semantic HTML and CSS code. Ensure the code is responsive, uses modern CSS (flexbox/grid), and is editable. Output ONLY the HTML and CSS wrapped in <html><head><style>...</style></head><body>...</body></html> format. Do not include JavaScript unless specified. Do not include any explanation, comments, or markdown code fences.`;

function cleanCode(text) {
  return text
    .replace(/^```html\n?/i, '')
    .replace(/^```\n?/, '')
    .replace(/\n?```$/, '')
    .trim();
}

export function getActiveModel() {
  return isHFConfigured()
    ? `Fine-tuned: ${import.meta.env.VITE_HF_MODEL}`
    : `Groq: ${MODEL}`;
}

// Streaming generate — uses HF fine-tuned model if configured, else Groq
export async function generateCodeStream(userPrompt, onChunk) {
  if (isHFConfigured()) {
    return generateWithHF(userPrompt, onChunk);
  }

  // Groq streaming
  const stream = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 2048,
    stream: true,
  });

  let full = '';
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || '';
    full += delta;
    onChunk(cleanCode(full));
  }
  return cleanCode(full);
}

export async function improveCode(currentCode, instruction) {
  if (isHFConfigured()) {
    return improveWithHF(currentCode, instruction);
  }

  const stream = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Here is existing HTML/CSS code:\n\n${currentCode}\n\nImprove it with the following instruction: ${instruction}\n\nReturn the full updated HTML/CSS only.`,
      },
    ],
    temperature: 0.7,
    max_tokens: 2048,
    stream: true,
  });

  let full = '';
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || '';
    full += delta;
  }
  return cleanCode(full);
}
