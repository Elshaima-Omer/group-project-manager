import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import {
  Plus,
  LogIn,
  FolderKanban,
  TrendingUp,
  Calendar,
  Bell,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — ScholarSync" }] }),
  component: Dashboard,
});

function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);

    // Get logged in user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    setProfile(profileData);

    // Get projects this user belongs to
    const { data: memberData } = await supabase
      .from("project_members")
      .select("*, projects(*)")
      .eq("user_id", user.id)
      .eq("status", "accepted");
    setProjects(memberData || []);

    // Get tasks assigned to this user
    const { data: taskData } = await supabase
      .from("tasks")
      .select("*")
      .eq("assigned_to", user.id)
      .order("deadline", { ascending: true });
    setTasks(taskData || []);

    // Get unread notifications for this user
    const { data: notifData } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .eq("read", false)
      .order("created_at", { ascending: false })
      .limit(5);
    setNotifications(notifData || []);

    setLoading(false);
  };

  const activeProjects = projects.filter((p) => {
    const status = String(p.projects?.status || "").toLowerCase();
    return status !== "completed" && status !== "done";
  }).length;

  const personalProgress = tasks.length > 0
    ? Math.round(tasks.reduce((s, t) => s + (t.progress || 0), 0) / tasks.length)
    : 0;

  const recentTasks = tasks.slice(0, 4);

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">
            Welcome back, {profile?.full_name?.split(" ")[0] || "there"} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's what's happening across your projects today.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/projects/create">
            <Button className="bg-gradient-primary shadow-elegant">
              <Plus className="mr-2 h-4 w-4" /> Create Project
            </Button>
          </Link>
          <Link to="/projects">
            <Button variant="outline">
              <LogIn className="mr-2 h-4 w-4" /> Join Project
            </Button>
          </Link>
          <Link to="/projects">
            <Button variant="ghost">View Projects</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FolderKanban} label="Active Projects" value={activeProjects} accent="primary" />
        <StatCard icon={TrendingUp} label="My Progress" value={`${personalProgress}%`} accent="success">
          <Progress value={personalProgress} className="mt-3 h-1.5" />
        </StatCard>
        <StatCard icon={Calendar} label="Upcoming Deadlines" value={tasks.filter(t => t.deadline).length} accent="warning" />
        <StatCard icon={Bell} label="Notifications" value={notifications.length} accent="accent" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Recent tasks */}
        <Card className="p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent Assigned Tasks</h2>
            <Link to="/projects" className="text-xs font-medium text-primary hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {tasks.length === 0 && (
              <p className="text-sm text-muted-foreground">No tasks assigned yet. Join or create a project to get started.</p>
            )}
            {recentTasks.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 p-3">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{t.title}</div>
                  <div className="text-xs text-muted-foreground">Due {t.deadline || "No deadline"}</div>
                </div>
                <div className="w-32">
                  <Progress value={t.progress || 0} className="h-1.5" />
                </div>
                <Badge variant="secondary">{t.status}</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Notifications</h2>
            <Badge variant="secondary">{notifications.length}</Badge>
          </div>
          <div className="space-y-3">
            {notifications.length === 0 && (
              <p className="text-sm text-muted-foreground">No notifications yet.</p>
            )}
            {notifications.map((n) => (
              <div key={n.id} className="rounded-lg border border-border/60 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{n.type}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{n.message}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Projects list */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="mb-4 font-display text-lg font-semibold">My Projects</h2>
          <div className="space-y-3">
            {projects.length === 0 && (
              <p className="text-sm text-muted-foreground">You haven't joined any projects yet.</p>
            )}
            {projects.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
                <div className="flex-1">
                  <div className="text-sm font-medium">{m.projects?.title || "Untitled Project"}</div>
                  <div className="text-xs text-muted-foreground">
                    Role: {m.role} · Deadline: {m.projects?.deadline || "No deadline"}
                  </div>
                </div>
                <Badge variant={m.role === "leader" ? "default" : "secondary"}>{m.role}</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* AI Insight */}
        <Card className="border-primary/30 bg-gradient-hero p-6">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="mt-2 font-display text-lg font-semibold">AI Insight</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {tasks.length === 0
              ? "Create or join a project to get AI-powered task suggestions and insights."
              : `You have ${tasks.filter(t => t.status === "pending").length} pending tasks. Stay on track!`}
          </p>
          <Button variant="outline" size="sm" className="mt-3">
            See suggestion <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Card>
      </div>
    </AppShell>
  );
}

function StatCard({
  icon: Icon, label, value, accent, children,
}: {
  icon: typeof Plus; label: string; value: string | number;
  accent: "primary" | "success" | "warning" | "accent"; children?: React.ReactNode;
}) {
  const accentMap = {
    primary: "bg-primary/15 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground",
    accent: "bg-accent text-accent-foreground",
  };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="mt-2 font-display text-3xl font-bold">{value}</div>
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accentMap[accent]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      {children}
    </Card>
  );
}