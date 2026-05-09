import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { mockProjects, mockNotifications, mockUpcomingDeadlines, currentUser } from "@/lib/mock-data";
import {
  Plus,
  LogIn,
  FolderKanban,
  TrendingUp,
  Calendar,
  Bell,
  CheckCircle2,
  Upload,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — ScholarSync" }] }),
  component: Dashboard,
});

function Dashboard() {
  const activeProjects = mockProjects.filter((p) => p.status === "Active").length;
  const personalProgress = Math.round(
    mockProjects.reduce((s, p) => s + p.myProgress, 0) / mockProjects.length,
  );
  const myTasks = mockProjects.flatMap((p) => p.tasks).filter((t) => t.assigneeId === "u1").slice(0, 4);
  const pendingSubs = mockProjects.flatMap((p) => p.submissions).filter((s) => s.status === "Pending").slice(0, 3);

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Welcome back, {currentUser.name.split(" ")[0]} 👋</h1>
          <p className="mt-1 text-sm text-muted-foreground">Here's what's happening across your projects today.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/projects/create">
            <Button className="bg-gradient-primary shadow-elegant"><Plus className="mr-2 h-4 w-4" /> Create Project</Button>
          </Link>
          <Link to="/projects">
            <Button variant="outline"><LogIn className="mr-2 h-4 w-4" /> Join Project</Button>
          </Link>
          <Link to="/projects"><Button variant="ghost">View Projects</Button></Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FolderKanban} label="Active Projects" value={activeProjects} accent="primary" />
        <StatCard icon={TrendingUp} label="My Progress" value={`${personalProgress}%`} accent="success">
          <Progress value={personalProgress} className="mt-3 h-1.5" />
        </StatCard>
        <StatCard icon={Calendar} label="Upcoming Deadlines" value={mockUpcomingDeadlines.length} accent="warning" />
        <StatCard icon={Bell} label="Notifications" value={mockNotifications.length} accent="accent" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Recent tasks */}
        <Card className="p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent Assigned Tasks</h2>
            <Link to="/projects" className="text-xs font-medium text-primary hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {myTasks.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 p-3">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{t.title}</div>
                  <div className="text-xs text-muted-foreground">Due {t.deadline}</div>
                </div>
                <div className="w-32">
                  <Progress value={t.progress} className="h-1.5" />
                </div>
                <StatusBadge status={t.status} />
              </div>
            ))}
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Notifications</h2>
            <Badge variant="secondary">{mockNotifications.length}</Badge>
          </div>
          <div className="space-y-3">
            {mockNotifications.map((n) => (
              <div key={n.id} className="rounded-lg border border-border/60 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{n.title}</span>
                  <span className="text-[10px] text-muted-foreground">{n.time}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{n.message}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Upcoming deadlines */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="mb-4 font-display text-lg font-semibold">Upcoming Deadlines</h2>
          <div className="space-y-3">
            {mockUpcomingDeadlines.map((d) => (
              <div key={d.title} className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
                <div className="flex h-10 w-10 flex-col items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground">
                  <span className="text-[10px] font-medium uppercase">{d.date.split(" ")[0]}</span>
                  <span className="text-sm font-bold">{d.date.split(" ")[1]}</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{d.title}</div>
                  <div className="text-xs text-muted-foreground">{d.project}</div>
                </div>
                <Badge variant={d.days < 7 ? "destructive" : "secondary"}>{d.days}d left</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Pending submissions + AI */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
              <Upload className="h-4 w-4 text-primary" /> Pending Submissions
            </h2>
            <div className="space-y-2">
              {pendingSubs.length === 0 && <p className="text-sm text-muted-foreground">All caught up.</p>}
              {pendingSubs.map((s) => (
                <div key={s.id} className="rounded-lg border border-border/60 p-3 text-sm">
                  <div className="font-medium">{s.taskTitle}</div>
                  <div className="text-xs text-muted-foreground">{s.fileName} · {s.uploadedAt}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-primary/30 bg-gradient-hero p-6">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="mt-2 font-display text-lg font-semibold">AI Insight</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              You're slightly ahead on Campus Nav. Consider helping the Mobility Report team — they're at 42%.
            </p>
            <Button variant="outline" size="sm" className="mt-3">
              See suggestion <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Card>
        </div>
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
