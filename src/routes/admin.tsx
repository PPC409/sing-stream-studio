import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin — Crown Karaoke" }] }),
});

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [songs, setSongs] = useState<Tables<"songs">[]>([]);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [audio, setAudio] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate({ to: "/auth" });
  }, [user, isAdmin, loading, navigate]);

  const refresh = async () => {
    const { data } = await supabase.from("songs").select("*").order("created_at", { ascending: false });
    setSongs(data ?? []);
  };

  useEffect(() => { if (isAdmin) refresh(); }, [isAdmin]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audio) return toast.error("Pick an audio file");
    setUploading(true);
    try {
      const ext = audio.name.split(".").pop();
      const key = `${crypto.randomUUID()}.${ext}`;
      const { error: aErr } = await supabase.storage.from("audio").upload(key, audio);
      if (aErr) throw aErr;
      const audio_url = supabase.storage.from("audio").getPublicUrl(key).data.publicUrl;

      let cover_url: string | null = null;
      if (cover) {
        const cExt = cover.name.split(".").pop();
        const cKey = `${crypto.randomUUID()}.${cExt}`;
        const { error: cErr } = await supabase.storage.from("covers").upload(cKey, cover);
        if (cErr) throw cErr;
        cover_url = supabase.storage.from("covers").getPublicUrl(cKey).data.publicUrl;
      }

      const { error: insErr } = await supabase.from("songs").insert({
        title, artist, audio_url, cover_url, lyrics: lyrics || null, uploaded_by: user!.id,
      });
      if (insErr) throw insErr;

      toast.success("Song uploaded");
      setTitle(""); setArtist(""); setLyrics(""); setAudio(null); setCover(null);
      (document.getElementById("upload-form") as HTMLFormElement)?.reset();
      refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this song?")) return;
    const { error } = await supabase.from("songs").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    refresh();
  };

  if (loading || !isAdmin) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Toaster />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight">Upload a song</h1>
        <p className="mt-1 text-muted-foreground">
          Add an audio file, cover art, and optional lyrics (plain or .lrc-style for synced karaoke).
        </p>

        <form id="upload-form" onSubmit={submit} className="mt-6 grid gap-4 rounded-2xl border border-border/60 bg-card p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="artist">Artist</Label>
              <Input id="artist" required value={artist} onChange={(e) => setArtist(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="audio">Audio file</Label>
              <Input id="audio" type="file" accept="audio/*" required onChange={(e) => setAudio(e.target.files?.[0] ?? null)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cover">Cover image (optional)</Label>
              <Input id="cover" type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lyrics">Lyrics (optional)</Label>
            <Textarea
              id="lyrics"
              rows={8}
              placeholder={"Paste plain lyrics, or use synced format:\n[00:12.50] First line of the song\n[00:16.20] Second line"}
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
          <Button type="submit" disabled={uploading} size="lg">
            {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading…</> : <><Upload className="mr-2 h-4 w-4" />Upload song</>}
          </Button>
        </form>

        <h2 className="mt-12 text-xl font-semibold">Your songs</h2>
        <div className="mt-4 space-y-2">
          {songs.length === 0 && <p className="text-sm text-muted-foreground">Nothing uploaded yet.</p>}
          {songs.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-4">
              <Link to="/song/$id" params={{ id: s.id }} className="hover:underline">
                <div className="font-medium">{s.title}</div>
                <div className="text-sm text-muted-foreground">{s.artist}</div>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => remove(s.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
