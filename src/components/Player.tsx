import { useEffect, useRef, useState } from "react";
import { Play, Pause, Mic2, Download, Check, Loader2, Trash2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { parseLyrics, activeLineIndex } from "@/lib/lyrics";
import { saveOffline, getOfflineUrl, isOffline, removeOffline } from "@/lib/offline";
import { toast } from "sonner";

function fmt(t: number) {
  if (!isFinite(t)) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function Player({ song }: { song: Tables<"songs"> }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const lyricsRef = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState<string>(song.audio_url);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [karaoke, setKaraoke] = useState(false);
  const [offline, setOffline] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const { synced, lines } = parseLyrics(song.lyrics);
  const active = synced ? activeLineIndex(lines, time) : -1;

  useEffect(() => {
    let revoke: string | null = null;
    (async () => {
      const cached = await getOfflineUrl(song.id);
      if (cached) {
        setSrc(cached);
        revoke = cached;
        setOffline(true);
      } else {
        setSrc(song.audio_url);
        setOffline(await isOffline(song.id));
      }
    })();
    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [song.id, song.audio_url]);

  useEffect(() => {
    if (active >= 0 && lyricsRef.current) {
      const el = lyricsRef.current.children[active] as HTMLElement | undefined;
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [active]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play();
    else a.pause();
  };

  const handleDownload = async () => {
    if (offline) {
      await removeOffline(song.id);
      setOffline(false);
      toast.success("Removed from offline");
      return;
    }
    setDownloading(true);
    setProgress(0);
    try {
      await saveOffline(song.id, song.audio_url, setProgress);
      setOffline(true);
      toast.success("Saved for offline listening", {
        description: "Plays without internet. Not visible in your Files app.",
      });
      const cached = await getOfflineUrl(song.id);
      if (cached) setSrc(cached);
    } catch (e) {
      toast.error("Couldn't save offline", { description: String(e) });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-royal">
      <div className="grid gap-6 p-6 md:grid-cols-[280px_1fr]">
        <div className="aspect-square overflow-hidden rounded-xl bg-muted">
          {song.cover_url ? (
            <img src={song.cover_url} alt={song.title} className="h-full w-full object-cover" />
          ) : (
            <div className="bg-royal grid h-full w-full place-items-center">
              <Mic2 className="h-20 w-20 text-primary-foreground/70" />
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{song.title}</h1>
            <p className="mt-1 text-muted-foreground">{song.artist}</p>
          </div>

          <audio
            ref={audioRef}
            src={src}
            preload="metadata"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          />

          <div className="mt-auto pt-6">
            <Slider
              value={[time]}
              min={0}
              max={duration || 100}
              step={0.1}
              onValueChange={(v) => {
                if (audioRef.current) audioRef.current.currentTime = v[0];
              }}
            />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground tabular-nums">
              <span>{fmt(time)}</span>
              <span>{fmt(duration)}</span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button onClick={toggle} size="lg" className="rounded-full">
                {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current" />}
                <span className="ml-2">{playing ? "Pause" : "Play"}</span>
              </Button>
              {lines.length > 0 && (
                <Button
                  variant={karaoke ? "default" : "secondary"}
                  onClick={() => setKaraoke((k) => !k)}
                >
                  <Mic2 className="mr-2 h-4 w-4" />
                  Karaoke
                </Button>
              )}
              <Button variant={offline ? "secondary" : "outline"} onClick={handleDownload} disabled={downloading}>
                {downloading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{progress}%</>
                ) : offline ? (
                  <><Trash2 className="mr-2 h-4 w-4" />Saved offline</>
                ) : (
                  <><Download className="mr-2 h-4 w-4" />Save offline</>
                )}
              </Button>
              {offline && <Check className="h-4 w-4 text-accent" aria-label="Available offline" />}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Offline saves the song inside this app only — it plays without internet and never appears in your phone's Files app.
            </p>
          </div>
        </div>
      </div>

      {karaoke && lines.length > 0 && (
        <div className="border-t border-border/60 bg-background/40 p-6">
          <div ref={lyricsRef} className="mx-auto max-h-80 max-w-2xl space-y-3 overflow-y-auto text-center">
            {lines.map((l, i) => (
              <p
                key={i}
                className={
                  "transition-all duration-300 " +
                  (i === active
                    ? "scale-110 text-2xl font-bold text-gradient-royal"
                    : "text-lg text-muted-foreground")
                }
              >
                {l.text || "♪"}
              </p>
            ))}
          </div>
          {!synced && (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Plain lyrics shown. Upload .lrc-style timestamps like [00:12.34] for synced highlighting.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
