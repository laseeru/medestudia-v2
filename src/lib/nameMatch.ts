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

/** Normalize a name for comparison */
export function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Whether two person names likely refer to the same person.
 * Strict algorithm: ignores single-char parts, requires >=60% of parts to match,
 * and part-level Levenshtein distance of at most 1.
 */
export function namesAreSimilar(a: string, b: string): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (na === nb) return false;

  // Quick length sanity check — if lengths differ by more than 40%, skip
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen > 0 && Math.abs(na.length - nb.length) / maxLen > 0.4) return false;

  // Whole-name Levenshtein — strict threshold (≤20% different)
  const fullDist = levenshtein(na, nb);
  if (maxLen > 0 && fullDist / maxLen <= 0.2) return true;

  // Part-based matching — ignore single-character parts
  const partsA = na.split(" ").filter((p) => p.length > 1);
  const partsB = nb.split(" ").filter((p) => p.length > 1);

  // Need at least 2 meaningful parts in each name
  if (partsA.length < 2 || partsB.length < 2) return false;

  const [shorter, longer] = partsA.length <= partsB.length ? [partsA, partsB] : [partsB, partsA];

  let matched = 0;
  for (const sp of shorter) {
    for (const lp of longer) {
      if (sp === lp) {
        matched++;
        break;
      }
      // Only compare parts longer than 3 chars and distance ≤ 1
      if (sp.length > 3 && lp.length > 3 && levenshtein(sp, lp) <= 1) {
        matched++;
        break;
      }
    }
  }

  // At least 60% of the shorter name's parts must match, minimum 2
  return matched >= Math.ceil(shorter.length * 0.6) && matched >= 2;
}
