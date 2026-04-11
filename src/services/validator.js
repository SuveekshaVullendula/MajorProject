/**
 * UI Validation Service
 * Mimics YOLO-based layout verification using structural HTML/CSS analysis.
 * Checks generated components against layout, semantic, accessibility and
 * responsiveness quality thresholds — iterative refinement stops when score >= threshold.
 */

const THRESHOLD = 75; // minimum quality score (0-100) to pass

export function validateCode(html) {
  if (!html || html.trim().length < 50) {
    return { score: 0, passed: false, checks: [], summary: 'No code to validate' };
  }

  const checks = [
    checkHasHtmlStructure(html),
    checkHasStyleTag(html),
    checkHasBodyContent(html),
    checkResponsiveCSS(html),
    checkSemanticElements(html),
    checkNoInlineStyles(html),
    checkColorContrast(html),
    checkHasLayout(html),
    checkImageAltText(html),
    checkFormLabels(html),
  ];

  const passed  = checks.filter((c) => c.passed).length;
  const score   = Math.round((passed / checks.length) * 100);
  const failing = checks.filter((c) => !c.passed).map((c) => c.label);

  return {
    score,
    passed: score >= THRESHOLD,
    threshold: THRESHOLD,
    checks,
    summary: score >= THRESHOLD
      ? `Quality check passed (${score}/100)`
      : `Quality check failed (${score}/100) — ${failing.slice(0, 2).join(', ')}`,
    suggestions: failing.map((f) => SUGGESTIONS[f]).filter(Boolean),
  };
}

// ── Individual checks ──────────────────────────────────────────────────────

function checkHasHtmlStructure(html) {
  const ok = /<html[\s>]/i.test(html) && /<\/html>/i.test(html);
  return { label: 'Valid HTML structure', passed: ok, weight: 1 };
}

function checkHasStyleTag(html) {
  const ok = /<style[\s>]/i.test(html);
  return { label: 'Contains CSS styles', passed: ok, weight: 1 };
}

function checkHasBodyContent(html) {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const ok = bodyMatch && bodyMatch[1].trim().length > 20;
  return { label: 'Has body content', passed: !!ok, weight: 1 };
}

function checkResponsiveCSS(html) {
  const ok = /@media\s*\(/i.test(html) ||
             /flex/i.test(html) ||
             /grid/i.test(html) ||
             /max-width/i.test(html) ||
             /min-width/i.test(html);
  return { label: 'Responsive CSS (flex/grid/media)', passed: ok, weight: 1 };
}

function checkSemanticElements(html) {
  const semanticTags = ['<header', '<nav', '<main', '<section', '<article', '<footer', '<aside', '<h1', '<h2', '<h3'];
  const ok = semanticTags.some((tag) => html.toLowerCase().includes(tag));
  return { label: 'Uses semantic HTML elements', passed: ok, weight: 1 };
}

function checkNoInlineStyles(html) {
  const inlineCount = (html.match(/style\s*=\s*["'][^"']*["']/gi) || []).length;
  const ok = inlineCount <= 3;
  return { label: 'Minimal inline styles', passed: ok, weight: 1 };
}

function checkColorContrast(html) {
  // Basic check: has explicit color definitions (not just default browser colors)
  const ok = /color\s*:/i.test(html) && /background/i.test(html);
  return { label: 'Explicit color definitions', passed: ok, weight: 1 };
}

function checkHasLayout(html) {
  const ok = /display\s*:\s*(flex|grid|block|inline-block)/i.test(html);
  return { label: 'Explicit layout (display property)', passed: ok, weight: 1 };
}

function checkImageAltText(html) {
  const images = html.match(/<img[^>]*>/gi) || [];
  if (images.length === 0) return { label: 'Image alt text', passed: true, weight: 1 };
  const ok = images.every((img) => /alt\s*=/i.test(img));
  return { label: 'Image alt text', passed: ok, weight: 1 };
}

function checkFormLabels(html) {
  const inputs = html.match(/<input[^>]*>/gi) || [];
  if (inputs.length === 0) return { label: 'Form accessibility', passed: true, weight: 1 };
  const hasLabels = /<label/i.test(html) || inputs.every((i) => /placeholder\s*=/i.test(i));
  return { label: 'Form accessibility', passed: hasLabels, weight: 1 };
}

const SUGGESTIONS = {
  'Valid HTML structure':              'Wrap output in <html>...</html> tags',
  'Contains CSS styles':               'Add a <style> block with CSS rules',
  'Has body content':                  'Add visible HTML elements inside <body>',
  'Responsive CSS (flex/grid/media)':  'Use flexbox, CSS grid, or @media queries for responsiveness',
  'Uses semantic HTML elements':       'Use <header>, <main>, <section>, <nav> instead of only <div>',
  'Minimal inline styles':             'Move styles to the <style> block instead of inline style=""',
  'Explicit color definitions':        'Define background-color and color properties explicitly',
  'Explicit layout (display property)':'Add display: flex or display: grid to layout containers',
  'Image alt text':                    'Add alt="" attributes to all <img> tags',
  'Form accessibility':                'Add <label> elements or placeholder attributes to form inputs',
};

export { THRESHOLD };
