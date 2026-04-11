import Groq from 'groq-sdk';

const client = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

const MODEL = 'llama-3.3-70b-versatile';

const VERIFIER_SYSTEM = `You are an extremely strict UI quality verification model inspired by YOLO object detection. Your job is to deeply analyze generated HTML/CSS code and verify whether it FULLY meets the user's original requirements at a professional production level.

You will receive:
1. The user's original prompt
2. The generated HTML/CSS code

Your task — be VERY STRICT and check ALL of the following:

FUNCTIONAL REQUIREMENTS (from the prompt):
- Every element explicitly mentioned must be present
- Every label, placeholder, or text content mentioned must match exactly
- Every interaction or state mentioned must be implemented

QUALITY REQUIREMENTS (always check these even if not mentioned):
- Form inputs must have proper <label> elements with matching 'for' attributes (not just placeholders)
- All interactive elements must have :hover and :focus CSS states defined
- Must have @media queries for mobile responsiveness (max-width: 768px at minimum)
- Color contrast must be explicitly defined (not relying on browser defaults)
- Form must have proper validation attributes (required, type="email", minlength etc.)
- Submit button must have explicit disabled state styling
- Must use semantic HTML5 elements (not just divs everywhere)
- CSS must use CSS variables or consistent color scheme
- Must have smooth transitions on interactive elements
- Error states must be styled

SCORING — be harsh:
- Missing any explicit prompt requirement: -15 points each
- Missing hover/focus states: -10 points
- Missing responsive @media queries: -10 points  
- Missing proper label associations: -8 points
- Missing form validation attributes: -8 points
- Missing transitions/animations: -5 points
- Missing CSS variables: -5 points
- Missing error state styling: -5 points
- Using only divs with no semantic elements: -8 points

Start from 100 and subtract. Most first-generation code should score 45-70.

Return ONLY strict JSON, no explanation, no markdown:
{
  "detectedComponents": ["list of UI components found"],
  "requirements": [
    {
      "requirement": "exact requirement or quality check",
      "status": "pass" | "fail" | "partial",
      "reason": "specific reason — quote the missing code or element",
      "found": true | false
    }
  ],
  "overallScore": 0-100,
  "passed": true | false,
  "summary": "one sentence verdict",
  "missingElements": ["specific missing items"],
  "extraElements": ["things added not requested"]
}`;

export async function verifyAgainstPrompt(userPrompt, generatedCode) {
  const userMessage = `USER PROMPT: "${userPrompt}"

GENERATED HTML/CSS CODE:
${generatedCode}

Apply strict verification. Check every functional requirement AND all quality standards. Most generated code is missing hover states, media queries, label associations, and validation attributes. Be harsh and accurate.`;

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: VERIFIER_SYSTEM },
      { role: 'user',   content: userMessage },
    ],
    temperature: 0.1,
    max_tokens: 2000,
  });

  const raw = response.choices[0]?.message?.content?.trim() || '';
  const cleaned = raw
    .replace(/^```json\n?/i, '')
    .replace(/^```\n?/, '')
    .replace(/\n?```$/, '')
    .trim();

  try {
    const result = JSON.parse(cleaned);
    // Safety cap — never allow 100 on first verify, max 85
    if (result.overallScore > 85) result.overallScore = 85;
    if (result.overallScore === 85) result.passed = false;
    return result;
  } catch {
    return {
      detectedComponents: [],
      requirements: [],
      overallScore: 0,
      passed: false,
      summary: 'Verification parsing failed',
      missingElements: [],
      extraElements: [],
    };
  }
}
