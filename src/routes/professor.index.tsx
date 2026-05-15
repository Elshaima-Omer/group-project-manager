import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { Users, Crown, FileText, AlertTriangle, CheckCircle2, BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/professor/")({
  head: () => ({ meta: [{ title: "Professor Dashboard — ScholarSync" }] }),
  component: ProfessorDashboard,
});

function ProfessorDashboard() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get professor profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    setProfile(profileData);

    // Get all projects linked to this professor
    const { data: linkedProjects } = await supabase
      .from("professor_projects")
      .select("*, projects(*)")
      .eq("professor_id", user.id);

    if (!linkedProjects || linkedProjects.length === 0) {
      // If no linked projects yet, show all projects for demo purposes
      const { data: allProjects } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      // For each project, get members and tasks
      const enriched = await Promise.all((allProjects || []).map(async (p) => {
        const { data: members } = await supabase
          .from("project_members")
          .select("*, profiles(*)")
          .eq("project_id", p.id)
          .eq("status", "accepted");

        const { data: tasks } = await supabase
          .from("tasks")
          .select("*")
          .eq("project_id", p.id);

        const leader = (members || []).find((m) => m.role === "leader");
        const overallProgress = tasks && tasks.length > 0
          ? Math.round(tasks.reduce((s: number, t: any) => s + (t.progress || 0), 0) / tasks.length)
          : 0;
        const approvedTasks = (tasks || []).filter((t) => t.status === "approved").length;
        const pendingTasks = (tasks || []).filter((t) => t.status !== "approved").length;

        return {
          ...p,
          members: members || [],
          leader: leader?.profiles?.full_name || "Unknown",
          tasks: tasks || [],
          overallProgress,
          approvedTasks,
          pendingTasks,
        };
      }));

      setProjects(enriched);
    } else {
      const enriched = await Promise.all(linkedProjects.map(async (lp) => {
        const p = lp.projects;

        const { data: members } = await supabase
          .from("project_members")
          .select("*, profiles(*)")
          .eq("project_id", p.id)
          .eq("status", "accepted");

        const { data: tasks } = await supabase
          .from("tasks")
          .select("*")
          .eq("project_id", p.id);

        const leader = (members || []).find((m) => m.role === "leader");
        const overallProgress = tasks && tasks.length > 0
          ? Math.round(tasks.reduce((s: number, t: any) => s + (t.progress || 0), 0) / tasks.length)
          : 0;

        return {
          ...p,
          members: members || [],
          leader: leader?.profiles?.full_name || "Unknown",
          tasks: tasks || [],
          overallProgress,
          approvedTasks: (tasks || []).filter((t) => t.status === "approved").length,
          pendingTasks: (tasks || []).filter((t) => t.status !== "approved").length,
        };
      }));

      setProjects(enriched);
    }

    setLoading(false);
  };

  const totalStudents = new Set(projects.flatMap((p) => p.members.map((m: any) => m.user_id))).size;
  const onTrack = projects.filter((p) => p.overallProgress >= 50).length;
  const delayed = projects.filter((p) => p.overallProgress < 50).length;

  if (loading) {
    return (
      <AppShell role="professor">
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="professor">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">
          Welcome, Prof. {profile?.full_name?.split(" ").slice(-1)[0] || "Professor"} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of all supervised student projects.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat icon={BookOpen} label="Active Projects" value={projects.length} />
        <Stat icon={Users} label="Total Students" value={totalStudents} />
        <Stat icon={CheckCircle2} label="On Track" value={`${onTrack}/${projects.length}`} />
        <Stat icon={AlertTriangle} label="Need Attention" value={delayed} />
      </div>

      <Card className="mt-6 p-6">
        <h2 className="mb-4 font-display text-lg font-semibold">All Groups</h2>
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No projects found. Projects created by students will appear here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Leader</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Tasks</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium">{p.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.id?.slice(0, 8).toUpperCase()} · {(p.type || []).join(", ")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Crown className="h-3 w-3 text-warning-foreground" /> {p.leader}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {p.members.slice(0, 4).map((m: any) => (
                            <Avatar key={m.id} className="h-7 w-7 border-2 border-background">
                              <AvatarFallback>{m.profiles?.full_name?.[0] || "?"}</AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">{p.members.length}</span>
                      </div>
                    </TableCell>
                    <TableCell className="w-40">
                      <div className="flex items-center gap-2">
                        <Progress value={p.overallProgress} className="h-1.5 flex-1" />
                        <span className="text-xs font-medium">{p.overallProgress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <span className="text-success">{p.approvedTasks} done</span>
                        {" · "}
                        <span className="text-destructive">{p.pendingTasks} pending</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-muted-foreground">{p.deadline || "No deadline"}</div>
                    </TableCell>
                    <TableCell>
                      <Link to="/professor/$projectId" params={{ projectId: p.id }}>
                        <Button size="sm" variant="outline">
                          <FileText className="mr-1 h-3 w-3" /> Report
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string | number }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="mt-2 font-display text-3xl font-bold">{value}</div>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </Card>
  );
}