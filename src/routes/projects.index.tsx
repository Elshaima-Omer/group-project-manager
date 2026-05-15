import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Plus, LogIn, Search, Calendar, Crown, User, Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/projects/")({
  head: () => ({ meta: [{ title: "Projects — ScholarSync" }] }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const [query, setQuery] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("project_members")
      .select("*, projects(*)")
      .eq("user_id", user.id)
      .eq("status", "accepted");

    if (error) {
      toast.error("Failed to load projects");
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  };

  const handleCopyId = (e: React.MouseEvent, fullId: string) => {
    e.preventDefault(); // prevent navigating to project
    e.stopPropagation();
    navigator.clipboard.writeText(fullId);
    setCopiedId(fullId);
    toast.success("Project ID copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = projects.filter((m) =>
    m.projects?.title?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AppShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">All projects you belong to as a leader or member.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/projects/create">
            <Button className="bg-gradient-primary shadow-elegant">
              <Plus className="mr-2 h-4 w-4" /> New Project
            </Button>
          </Link>
          <JoinProjectDialog onJoined={loadProjects} />
        </div>
      </div>

      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects..."
          className="pl-9"
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading projects...</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <p className="text-muted-foreground">You haven't joined any projects yet.</p>
          <div className="mt-4 flex gap-2">
            <Link to="/projects/create">
              <Button className="bg-gradient-primary"><Plus className="mr-2 h-4 w-4" /> Create Project</Button>
            </Link>
            <JoinProjectDialog onJoined={loadProjects} />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((m) => (
            <Link key={m.id} to="/projects/$projectId" params={{ projectId: m.projects?.id }}>
              <Card className="group h-full p-6 transition-all hover:-translate-y-0.5 hover:shadow-elegant">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {/* Full ID with copy button */}
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs text-muted-foreground truncate max-w-[160px]">
                        {m.projects?.id}
                      </span>
                      <button
                        onClick={(e) => handleCopyId(e, m.projects?.id)}
                        className="flex-shrink-0 rounded p-0.5 hover:bg-muted transition-colors"
                        title="Copy full project ID"
                      >
                        {copiedId === m.projects?.id
                          ? <Check className="h-3 w-3 text-success" />
                          : <Copy className="h-3 w-3 text-muted-foreground" />
                        }
                      </button>
                    </div>
                    <h3 className="mt-1 font-display text-lg font-semibold leading-snug">
                      {m.projects?.title || "Untitled Project"}
                    </h3>
                  </div>
                  <Badge variant={m.role === "leader" ? "default" : "secondary"} className="gap-1 flex-shrink-0">
                    {m.role === "leader" ? <Crown className="h-3 w-3" /> : <User className="h-3 w-3" />}
                    {m.role}
                  </Badge>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(m.projects?.type || []).map((t: string) => (
                    <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{m.projects?.deadline || "No deadline"}</span>
                  </div>
                  <Badge variant="secondary">{m.projects?.status || "active"}</Badge>
                </div>

                {/* Password hint for leaders */}
                {m.role === "leader" && (
                  <div className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                    🔑 Password: <span className="font-mono font-medium text-foreground">{m.projects?.password}</span>
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function JoinProjectDialog({ onJoined }: { onJoined: () => void }) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: project, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId.trim())
      .eq("password", password)
      .single();

    if (error || !project) {
      toast.error("Project not found or wrong password.");
      setLoading(false);
      return;
    }

    const { data: existing } = await supabase
      .from("project_members")
      .select("*")
      .eq("project_id", projectId.trim())
      .eq("user_id", user.id)
      .single();

    if (existing) {
      toast.error("You are already a member of this project.");
      setLoading(false);
      return;
    }

    const { error: joinError } = await supabase
      .from("project_members")
      .insert({
        project_id: projectId.trim(),
        user_id: user.id,
        role: "member",
        status: "pending",
      });

    if (joinError) {
      toast.error("Failed to send join request.");
      setLoading(false);
      return;
    }

    const { data: leader } = await supabase
      .from("project_members")
      .select("user_id")
      .eq("project_id", projectId.trim())
      .eq("role", "leader")
      .single();

    if (leader) {
      await supabase.from("notifications").insert({
        user_id: leader.user_id,
        message: `A new student wants to join your project "${project.title}".`,
        type: "join_request",
      });
    }

    toast.success("Join request sent to project leader!");
    setSubmitted(true);
    setLoading(false);
    onJoined();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSubmitted(false); }}>
      <DialogTrigger asChild>
        <Button variant="outline"><LogIn className="mr-2 h-4 w-4" /> Join Project</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join an existing project</DialogTitle>
          <DialogDescription>Enter the project ID and password shared by the leader.</DialogDescription>
        </DialogHeader>
        {submitted ? (
          <div className="space-y-2 rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm">
            <div className="font-semibold">Request pending</div>
            <p className="text-muted-foreground">Your request has been sent to the project leader. You'll be notified when they respond.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pid">Project ID</Label>
              <Input
                id="pid"
                placeholder="Paste the full project ID here"
                required
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Ask the project leader to copy the ID from their projects page</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ppwd">Project Password</Label>
              <Input
                id="ppwd"
                type="password"
                placeholder="Enter password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading} className="bg-gradient-primary">
                {loading ? "Sending..." : "Send join request"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}