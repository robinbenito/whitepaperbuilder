export interface Segment {
  text: string;
  /** highlighted because it was added/changed vs the previous prompt, or manually marked */
  highlight: boolean;
}

/** Tokenize into words + the whitespace/punctuation between them, preserving everything. */
function tokenize(s: string): string[] {
  return s.match(/\s+|[^\s]+/g) ?? [];
}

/**
 * Word-level LCS diff. Returns the tokens of `current`, flagging those that are
 * NOT part of the longest common subsequence with `previous` (i.e. added/changed).
 */
function diffHighlight(current: string, previous: string): Segment[] {
  const a = tokenize(previous);
  const b = tokenize(current);
  const n = a.length;
  const m = b.length;

  // LCS dynamic programming table
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  // Walk b, marking tokens that are not matched in the LCS as highlighted.
  const segments: Segment[] = [];
  let i = 0;
  let j = 0;
  const push = (text: string, highlight: boolean) => {
    const last = segments[segments.length - 1];
    if (last && last.highlight === highlight) last.text += text;
    else segments.push({ text, highlight });
  };
  while (j < m) {
    if (i < n && a[i] === b[j]) {
      push(b[j], false);
      i++;
      j++;
    } else if (i < n && dp[i + 1][j] >= dp[i][j + 1]) {
      i++; // token only in previous — skip
    } else {
      const isWhitespace = /^\s+$/.test(b[j]);
      push(b[j], !isWhitespace); // added/changed token in current
      j++;
    }
  }
  return segments;
}

/** Parse manual ==highlight== marks into segments. */
function parseManual(s: string): Segment[] {
  const segments: Segment[] = [];
  const re = /==([^=]+)==/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(s))) {
    if (match.index > last) segments.push({ text: s.slice(last, match.index), highlight: false });
    segments.push({ text: match[1], highlight: true });
    last = match.index + match[0].length;
  }
  if (last < s.length) segments.push({ text: s.slice(last), highlight: false });
  return segments.length ? segments : [{ text: s, highlight: false }];
}

/**
 * Produce highlight segments for a prompt.
 * Highlighting is driven solely by manual ==marks== (no automatic diffing).
 * Use markDifferences() to turn a diff into marks on demand.
 */
export function highlightPrompt(current: string): Segment[] {
  if (/==[^=]+==/.test(current)) return parseManual(current);
  return [{ text: current, highlight: false }];
}

/** Strip all ==highlight== marks, returning plain text. */
export function clearMarks(s: string): string {
  return s.replace(/==/g, '');
}

/**
 * Rewrite `current` so the words that differ from `previous` are wrapped in
 * ==marks==. Any existing marks are cleared first so re-running is idempotent.
 * If there is no previous prompt, returns the cleaned text unchanged.
 */
export function markDifferences(current: string, previous?: string): string {
  const clean = clearMarks(current);
  if (!previous || !previous.trim()) return clean;
  return diffHighlight(clean, clearMarks(previous))
    .map((seg) => (seg.highlight ? `==${seg.text}==` : seg.text))
    .join('');
}
