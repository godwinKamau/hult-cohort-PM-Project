function fuzzyMatch(query: string, text: string): number {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return 1;

  const normalizedText = text.toLowerCase();
  if (!normalizedText) return 0;

  if (normalizedText.includes(normalizedQuery)) {
    return 1 + normalizedQuery.length / normalizedText.length;
  }

  let queryIndex = 0;
  let score = 0;
  let consecutive = 0;

  for (
    let index = 0;
    index < normalizedText.length && queryIndex < normalizedQuery.length;
    index++
  ) {
    if (normalizedText[index] === normalizedQuery[queryIndex]) {
      score += 1 + consecutive * 0.5;

      if (
        index === 0 ||
        normalizedText[index - 1] === " " ||
        normalizedText[index - 1] === "_"
      ) {
        score += 0.75;
      }

      consecutive += 1;
      queryIndex += 1;
    } else {
      consecutive = 0;
    }
  }

  if (queryIndex !== normalizedQuery.length) {
    return 0;
  }

  return score / normalizedQuery.length;
}

export function fuzzyScoreTicket(
  query: string,
  fields: string[]
): number {
  if (!query.trim()) return 1;

  const weights = [2, 1.25, 1, 0.9, 0.9];
  let bestScore = 0;

  fields.forEach((field, index) => {
    if (!field) return;
    const weight = weights[index] ?? 0.75;
    bestScore = Math.max(bestScore, fuzzyMatch(query, field) * weight);
  });

  return bestScore;
}

export function ticketMatchesQuery(query: string, fields: string[]): boolean {
  return fuzzyScoreTicket(query, fields) > 0;
}
