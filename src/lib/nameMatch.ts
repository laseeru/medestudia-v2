/** Levenshtein distance between two strings */
export function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/** Whether two person names likely refer to the same person */
export function namesAreSimilar(a: string, b: string): boolean {
  const na = a.toLowerCase().trim().replace(/\s+/g, " ");
  const nb = b.toLowerCase().trim().replace(/\s+/g, " ");
  if (na === nb) return false;

  const dist = levenshtein(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen > 0 && dist / maxLen <= 0.25) return true;

  const partsA = na.split(" ");
  const partsB = nb.split(" ");
  const [shorter, longer] = partsA.length <= partsB.length ? [partsA, partsB] : [partsB, partsA];
  const matched = shorter.filter((p) => longer.some((lp) => {
    if (lp.includes(p) || p.includes(lp)) return true;
    return lp.length > 2 && p.length > 2 && levenshtein(p, lp) <= 2;
  }));
  return matched.length >= Math.min(shorter.length, 2);
}

/** Normalize a name for comparison */
export function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}
