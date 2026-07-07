export function stripHtml(text = '') {
  return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function normalizeText(text = '') {
  return stripHtml(text).toLowerCase();
}

export function containsKeyword(haystack, keyword) {
  return normalizeText(haystack).includes(normalizeText(keyword));
}

export function containsAny(haystack, keywords = []) {
  return keywords.some((keyword) => containsKeyword(haystack, keyword));
}

/** Word-boundary match — avoids false positives like "sr" matching inside "SRE". */
export function containsKeywordBoundary(haystack, keyword) {
  const text = normalizeText(haystack);
  const word = normalizeText(keyword).trim();
  if (!word) return false;

  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
  return re.test(text);
}

export function containsAnyBoundary(haystack, keywords = []) {
  return keywords.some((keyword) => containsKeywordBoundary(haystack, keyword));
}

export function containsAll(haystack, keywords = []) {
  return keywords.every((keyword) => containsKeyword(haystack, keyword));
}
