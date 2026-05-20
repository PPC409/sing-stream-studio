import { Link } from "@tanstack/react-router";
import { Music2, Upload, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { user, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-royal grid h-9 w-9 place-items-center rounded-lg shadow-royal">
            <Music2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-semibold tracking-tight">
            <span className="text-gradient-royal">Crown</span> Karaoke
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          {isAdmin && (
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin"><Upload className="mr-2 h-4 w-4" />Upload</Link>
            </Button>
          )}
          {user ? (
            <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>
              <LogOut className="mr-2 h-4 w-4" />Sign out
            </Button>
          ) : (
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Admin sign in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
