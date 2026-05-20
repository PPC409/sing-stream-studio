import { Link } from "@tanstack/react-router";
import { Play, Mic2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

export function SongCard({ song }: { song: Tables<"songs"> }) {
  return (
    <Link
      to="/song/$id"
      params={{ id: song.id }}
      className="group relative overflow-hidden rounded-xl border border-border/60 bg-card transition hover:border-primary/60 hover:shadow-royal"
    >
      <div className="aspect-square overflow-hidden bg-muted">
        {song.cover_url ? (
          <img
            src={song.cover_url}
            alt={song.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="bg-royal grid h-full w-full place-items-center opacity-80">
            <Mic2 className="h-12 w-12 text-primary-foreground/70" />
          </div>
        )}
        <div className="absolute inset-0 grid place-items-center bg-background/40 opacity-0 transition group-hover:opacity-100">
          <div className="bg-royal grid h-14 w-14 place-items-center rounded-full shadow-glow">
            <Play className="h-6 w-6 fill-primary-foreground text-primary-foreground" />
          </div>
        </div>
      </div>
      <div className="p-3">
        <div className="truncate font-medium">{song.title}</div>
        <div className="truncate text-sm text-muted-foreground">{song.artist}</div>
      </div>
    </Link>
  );
}
