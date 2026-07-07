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

export function containsAll(haystack, keywords = []) {
  return keywords.every((keyword) => containsKeyword(haystack, keyword));
}
