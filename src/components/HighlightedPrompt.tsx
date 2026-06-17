import { highlightPrompt } from '../lib/promptDiff';

interface Props {
  prompt: string;
  className?: string;
}

/** Renders a prompt with manual ==highlight== marks as inline <mark> spans. */
export default function HighlightedPrompt({ prompt, className }: Props) {
  const segments = highlightPrompt(prompt);
  return (
    <span className={className}>
      {segments.map((seg, i) =>
        seg.highlight ? (
          <mark key={i} className="prompt-mark">
            {seg.text}
          </mark>
        ) : (
          <span key={i} className="font-mono text-[0.85em]">
            {seg.text}
          </span>
        ),
      )}
    </span>
  );
}
