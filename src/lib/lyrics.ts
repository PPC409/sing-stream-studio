// LRC parser. Falls back to plain lines if no timestamps present.
export type LyricLine = { time: number; text: string };

export function parseLyrics(raw: string | null | undefined): { synced: boolean; lines: LyricLine[] } {
  if (!raw) return { synced: false, lines: [] };
  const lines: LyricLine[] = [];
  let synced = false;
  for (const line of raw.split(/\r?\n/)) {
    const matches = [...line.matchAll(/\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g)];
    if (matches.length > 0) {
      synced = true;
      const text = line.replace(/\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g, "").trim();
      for (const m of matches) {
        const min = Number(m[1]);
        const sec = Number(m[2]);
        const ms = m[3] ? Number(m[3].padEnd(3, "0")) : 0;
        lines.push({ time: min * 60 + sec + ms / 1000, text });
      }
    } else if (line.trim()) {
      lines.push({ time: -1, text: line.trim() });
    }
  }
  lines.sort((a, b) => a.time - b.time);
  return { synced, lines };
}

export function activeLineIndex(lines: LyricLine[], time: number): number {
  let idx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= time) idx = i;
    else break;
  }
  return idx;
}
