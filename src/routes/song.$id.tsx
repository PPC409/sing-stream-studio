import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { SiteHeader } from "@/components/SiteHeader";
import { Player } from "@/components/Player";
import { Toaster } from "@/components/ui/sonner";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/song/$id")({
  component: SongPage,
});

function SongPage() {
  const { id } = Route.useParams();
  const [song, setSong] = useState<Tables<"songs"> | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    supabase.from("songs").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      if (data) setSong(data);
      else setNotFound(true);
    });
  }, [id]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Toaster />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />Back to library
        </Link>
        {notFound ? (
          <div className="rounded-2xl border border-border/60 bg-card p-12 text-center text-muted-foreground">
            Song not found.
          </div>
        ) : song ? (
          <Player song={song} />
        ) : (
          <div className="h-96 animate-pulse rounded-2xl bg-card" />
        )}
      </main>
    </div>
  );
}
