/**
 * Split Gemini digest brief (DB column: summary) into sentences for readable line breaks.
 * Keeps trailing . ! ? 。 on each sentence.
 */
export function splitDigestSummarySentences(summary) {
  const text = String(summary ?? "").trim();
  if (!text) {
    return [];
  }

  const matches = text.match(/[^.!?。]+(?:[.!?。]+(?:\s+|$)|$)/g);
  if (!matches?.length) {
    return [text];
  }

  return matches.map((part) => part.trim()).filter(Boolean);
}
