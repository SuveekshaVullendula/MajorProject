import { improveCode } from './openai';
import { verifyAgainstPrompt } from './yoloVerifier';

const MAX_ITERATIONS = 3;
const PASS_THRESHOLD = 85;

/**
 * Iteratively refines generated code using YOLO prompt-aware verification.
 * Each iteration:
 *  1. Verifies the code against the original user prompt
 *  2. Extracts failing/partial requirements
 *  3. Builds a targeted fix instruction from those specific failures
 *  4. Sends to LLM to fix
 *  5. Repeats until score >= 75 or max iterations reached
 *
 * onIteration(iterNum, code, verifyResult) is called after each pass.
 */
export async function iterativeRefine(initialCode, userPrompt, onIteration) {
  let code      = initialCode;
  let result    = await verifyAgainstPrompt(userPrompt, code);
  let iteration = 0;

  // Normalise result shape for the UI
  const normalise = (r) => ({
    score:  r.overallScore ?? 0,
    passed: r.passed ?? false,
    raw:    r,
  });

  onIteration(iteration, code, normalise(result));

  while (!result.passed && result.overallScore < PASS_THRESHOLD && iteration < MAX_ITERATIONS) {
    iteration++;

    // Build a precise fix instruction from failing/partial requirements
    const failing = (result.requirements || [])
      .filter((r) => r.status === 'fail' || r.status === 'partial')
      .map((r) => r.requirement);

    const missing = result.missingElements || [];

    const allIssues = [...new Set([...failing, ...missing])];

    const instruction = allIssues.length > 0
      ? `The following requirements from the original prompt are NOT met — fix them:\n${allIssues.map((i) => `- ${i}`).join('\n')}\n\nOriginal prompt was: "${userPrompt}"`
      : `Improve the code to better match the original prompt: "${userPrompt}"`;

    code   = await improveCode(code, instruction);
    result = await verifyAgainstPrompt(userPrompt, code);

    onIteration(iteration, code, normalise(result));
  }

  return { code, result, iterations: iteration };
}
