import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { SiteHeader } from "@/components/SiteHeader";
import { SongCard } from "@/components/SongCard";
import { Toaster } from "@/components/ui/sonner";
import { Mic2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Crown Karaoke — Listen & Sing Along" },
      { name: "description", content: "A royal music library. Stream songs, sing karaoke with synced lyrics, and save tracks offline." },
    ],
  }),
});

function Index() {
  const [songs, setSongs] = useState<Tables<"songs">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("songs")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setSongs(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Toaster />

      <section className="relative overflow-hidden border-b border-border/60">
        <div
          className="absolute inset-0 opacity-40"
          style={{ background: "var(--gradient-stage)" }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center">
          <div className="bg-royal mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl shadow-glow">
            <Mic2 className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight md:text-6xl">
            Your <span className="text-gradient-royal">royal</span> music room
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Stream the collection, sing along with lyrics, and save songs for offline listening — no file downloads, no clutter.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight">Library</h2>
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[1/1.2] animate-pulse rounded-xl bg-card" />
            ))}
          </div>
        ) : songs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
            <p className="text-muted-foreground">No songs yet.</p>
            <Button asChild className="mt-4">
              <Link to="/auth">Sign in to upload</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {songs.map((s) => <SongCard key={s.id} song={s} />)}
          </div>
        )}
      </main>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        Built with love · Crown Karaoke
      </footer>
    </div>
  );
}
