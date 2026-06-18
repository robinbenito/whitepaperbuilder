export interface SynthesisResult {
  title: string;
  abstract: string;
  synthesis: string;
}

/** Calls the serverless synthesize endpoint to turn rough notes into structured sections. */
export async function synthesizeNotes(rough: string): Promise<SynthesisResult> {
  const res = await fetch('/api/synthesize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rough }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Synthesis failed (${res.status}).`);
  }
  return data as SynthesisResult;
}
