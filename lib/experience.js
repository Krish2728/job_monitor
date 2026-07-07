import { normalizeText, stripHtml } from './normalize.js';

function collectNumbers(text, regex) {
  const values = [];
  for (const match of text.matchAll(regex)) {
    const nums = match.slice(1).map((part) => Number.parseInt(part, 10)).filter(Number.isFinite);
    values.push(...nums);
  }
  return values;
}

/**
 * Returns the highest minimum years of experience explicitly required in text.
 * null when no requirement is detected.
 */
export function getMinimumRequiredYears(text = '') {
  const normalized = normalizeText(stripHtml(text));
  if (!normalized) return null;

  const minimums = [];

  // 3+ years, 4+ yrs
  minimums.push(
    ...collectNumbers(normalized, /(\d+)\s*\+\s*(?:years?|yrs?)\b/gi)
  );

  // minimum 3 years / at least 4 yrs
  minimums.push(
    ...collectNumbers(
      normalized,
      /(?:minimum|min(?:imum)?|at least|least)\s*(?:of\s*)?(\d+)\s*(?:years?|yrs?)\b/gi
    )
  );

  // 3-5 years, 3 to 5 years, 3 - 5 yrs of experience
  for (const match of normalized.matchAll(
    /(\d+)\s*(?:\+?\s*(?:to|-)\s*(\d+)|-\s*(\d+))\s*(?:\+?\s*)?(?:years?|yrs?)\b/gi
  )) {
    minimums.push(Number.parseInt(match[1], 10));
  }

  // (1 - 3 years), (2 to 4 yrs)
  for (const match of normalized.matchAll(
    /\(\s*(\d+)\s*(?:to|-)\s*(\d+)\s*(?:years?|yrs?)\s*\)/gi
  )) {
    minimums.push(Number.parseInt(match[1], 10));
  }

  // 4 years experience / 4 years of experience
  minimums.push(
    ...collectNumbers(
      normalized,
      /(?:^|[^0-9])(\d+)\s*(?:years?|yrs?)\s+(?:of\s+)?experience\b/gi
    )
  );

  // 4 year experience
  minimums.push(
    ...collectNumbers(normalized, /(?:^|[^0-9])(\d+)\s*(?:years?|yrs?)\s+experience\b/gi)
  );

  if (!minimums.length) return null;
  return Math.max(...minimums);
}

export function experienceWithinLimit(job, maxYears = 2) {
  const blob = [job.role, job.description].filter(Boolean).join('\n');
  const minRequired = getMinimumRequiredYears(blob);

  if (minRequired === null) {
    return { ok: true, minRequired: null };
  }

  return {
    ok: minRequired <= maxYears,
    minRequired,
  };
}
