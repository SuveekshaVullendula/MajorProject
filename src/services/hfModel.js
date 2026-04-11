/**
 * Hugging Face Inference API service
 * Used when a fine-tuned model is available on HF Hub.
 * Falls back to Groq if HF key or model is not configured.
 */

const HF_API_KEY = import.meta.env.VITE_HF_API_KEY;
const HF_MODEL   = import.meta.env.VITE_HF_MODEL;
const HF_URL     = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

const SYSTEM_PROMPT = `You are a code generation assistant. Given a natural language description of a UI component, generate valid, semantic HTML and CSS code. Output ONLY the HTML and CSS wrapped in <html><head><style>...</style></head><body>...</body></html> format. No explanation, no markdown fences.`;

function cleanCode(text) {
  return text
    .replace(/^```html\n?/i, '')
    .replace(/^```\n?/, '')
    .replace(/\n?```$/, '')
    .replace(/<\|im_end\|>/g, '')
    .replace(/<\|im_start\|>\w+\n?/g, '')
    .trim();
}

export function isHFConfigured() {
  return !!(HF_API_KEY && HF_MODEL && HF_MODEL !== 'your-username/llama-html-codegen');
}

export async function generateWithHF(userPrompt, onChunk) {
  // Qwen2.5 ChatML format
  const input = (
    `<|im_start|>system\n${SYSTEM_PROMPT}<|im_end|>\n` +
    `<|im_start|>user\n${userPrompt}<|im_end|>\n` +
    `<|im_start|>assistant\n`
  );

  const response = await fetch(HF_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HF_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: input,
      parameters: {
        max_new_tokens: 2048,
        temperature: 0.7,
        return_full_text: false,
        do_sample: true,
      },
      options: {
        wait_for_model: true, // auto-waits if model is loading (cold start)
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    // Model still loading — common on free tier
    if (response.status === 503) {
      throw new Error('Model is loading on HF servers, retry in 20 seconds');
    }
    throw new Error(err.error || `HF API error ${response.status}`);
  }

  const data = await response.json();
  const text = Array.isArray(data)
    ? data[0]?.generated_text || ''
    : data?.generated_text || '';

  const code = cleanCode(text);
  onChunk?.(code);
  return code;
}

export async function improveWithHF(currentCode, instruction) {
  const input = (
    `<|im_start|>system\n${SYSTEM_PROMPT}<|im_end|>\n` +
    `<|im_start|>user\nHere is existing HTML/CSS:\n${currentCode}\n\nImprove it: ${instruction}<|im_end|>\n` +
    `<|im_start|>assistant\n`
  );

  const response = await fetch(HF_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HF_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: input,
      parameters: {
        max_new_tokens: 2048,
        temperature: 0.7,
        return_full_text: false,
        do_sample: true,
      },
      options: { wait_for_model: true },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HF API error ${response.status}`);
  }

  const data = await response.json();
  const text = Array.isArray(data)
    ? data[0]?.generated_text || ''
    : data?.generated_text || '';

  return cleanCode(text);
}
