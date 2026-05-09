import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { mockProjects } from "@/lib/mock-data";
import { Plus, LogIn, Search, Calendar, Crown, User } from "lucide-react";
import { useState } from "react";
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
  const filtered = mockProjects.filter((p) => p.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <AppShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">All projects you belong to as a leader or member.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/projects/create">
            <Button className="bg-gradient-primary shadow-elegant"><Plus className="mr-2 h-4 w-4" /> New Project</Button>
          </Link>
          <JoinProjectDialog />
        </div>
      </div>

      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects..." className="pl-9" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => (
          <Link key={p.id} to="/projects/$projectId" params={{ projectId: p.id }}>
            <Card className="group h-full p-6 transition-all hover:-translate-y-0.5 hover:shadow-elegant">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-mono text-muted-foreground">{p.id}</div>
                  <h3 className="mt-1 font-display text-lg font-semibold leading-snug">{p.title}</h3>
                </div>
                <Badge variant={p.myRole === "Leader" ? "default" : "secondary"} className="gap-1">
                  {p.myRole === "Leader" ? <Crown className="h-3 w-3" /> : <User className="h-3 w-3" />}
                  {p.myRole}
                </Badge>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.type.map((t) => (
                  <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{p.deadline}</span>
                </div>
                <StatusBadge status={p.status} />
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Overall progress</span>
                  <span className="font-medium">{p.progress}%</span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-gradient-primary transition-all" style={{ width: `${p.progress}%` }} />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}

function JoinProjectDialog() {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success("Join request sent to project leader!");
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
              <Input id="pid" placeholder="PRJ-2284" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ppwd">Project Password</Label>
              <Input id="ppwd" type="password" placeholder="Enter password" required />
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-gradient-primary">Send join request</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
