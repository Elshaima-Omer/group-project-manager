import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/status-badge";
import { mockProfessorProjects } from "@/lib/mock-data";
import { ArrowLeft, Download, Sparkles, Crown, Calendar, CheckCircle2, MessageSquare, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/professor/$projectId")({
  head: ({ params }) => ({ meta: [{ title: `Report ${params.projectId} — ScholarSync` }] }),
  loader: ({ params }) => {
    const project = mockProfessorProjects.find((p) => p.id === params.projectId);
    if (!project) throw notFound();
    return { project };
  },
  component: FinalReport,
  notFoundComponent: () => (
    <AppShell role="professor">
      <Card className="p-12 text-center">
        <h2 className="text-xl font-semibold">Report not found</h2>
        <Link to="/professor" className="mt-4 inline-block text-primary hover:underline">Back to dashboard</Link>
      </Card>
    </AppShell>
  ),
});

function FinalReport() {
  const { project: p } = Route.useLoaderData() as { project: (typeof mockProfessorProjects)[number] };
  const completedTasks = p.tasks.filter((t) => t.status === "Approved").length;

  return (
    <AppShell role="professor">
      <Link to="/professor" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      {/* Report header */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-primary p-8 text-primary-foreground">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge variant="secondary" className="gap-1"><Sparkles className="h-3 w-3" /> AI Final Report</Badge>
              <h1 className="mt-3 font-display text-3xl font-bold">{p.title}</h1>
              <p className="mt-1 text-sm text-primary-foreground/80">{p.id} · {p.course}</p>
            </div>
            <Button variant="secondary" onClick={() => toast.success("Report PDF downloaded")}>
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
          </div>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-4">
          <Stat label="Final Progress" value={`${p.progress}%`} icon={TrendingUp} />
          <Stat label="Tasks Completed" value={`${completedTasks}/${p.tasks.length}`} icon={CheckCircle2} />
          <Stat label="Deadlines Met" value={`${p.deadlinesMet}/${p.deadlinesMet + p.deadlinesMissed}`} icon={Calendar} />
          <Stat label="Status" value={p.status} icon={Sparkles} />
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold">Project Summary</h2>
          <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>

          <h3 className="mt-6 font-display font-semibold">Member Contributions</h3>
          <div className="mt-3 space-y-3">
            {p.members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={m.avatar} />
                  <AvatarFallback>{m.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    {m.name}
                    {m.role === "Leader" && <Crown className="h-3 w-3 text-warning-foreground" />}
                  </div>
                  <Progress value={m.contribution * 3} className="mt-1 h-1.5" />
                </div>
                <span className="text-sm font-bold">{m.contribution}%</span>
              </div>
            ))}
          </div>

          <h3 className="mt-6 font-display font-semibold">Tasks Completed</h3>
          <div className="mt-3 space-y-2">
            {p.tasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border border-border/60 p-3 text-sm">
                <span>{t.title}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{t.assigneeName}</span>
                  <StatusBadge status={t.status} />
                </div>
              </div>
            ))}
          </div>

          <h3 className="mt-6 font-display font-semibold">Timeline Performance</h3>
          <div className="mt-3 space-y-2">
            {p.milestones.map((m) => (
              <div key={m.title} className="flex items-center justify-between rounded-lg border border-border/60 p-3 text-sm">
                <span>{m.title}</span>
                <Badge variant={m.done ? "default" : "secondary"}>
                  {m.done ? "Completed" : "Pending"} · {m.date}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="border-primary/30 bg-gradient-hero p-6">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="mt-2 font-display font-semibold">AI Evaluation Summary</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              The team demonstrated strong execution with balanced contributions across members. Leadership coordination
              was effective, with clear task delegation and proactive deadline management. AI recommends recognizing
              the leader's facilitation skills and the team's collaborative approach.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                { l: "Collaboration", v: "A" },
                { l: "Timeliness", v: p.deadlinesMissed > 0 ? "B" : "A" },
                { l: "Quality", v: "A-" },
                { l: "Innovation", v: "A" },
              ].map((g) => (
                <div key={g.l} className="rounded-lg border border-border/60 bg-background/50 p-3 text-center">
                  <div className="font-display text-xl font-bold text-gradient">{g.v}</div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{g.l}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="flex items-center gap-2 font-display font-semibold">
              <MessageSquare className="h-4 w-4 text-primary" /> Leader Comments
            </h3>
            <p className="mt-2 text-sm italic text-muted-foreground">
              "The team handled the unexpected scope changes really well. Marco's backend work was outstanding,
              and Priya kept our research grounded. Proud of what we shipped." — {p.leader}
            </p>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Crown }) {
  return (
    <div className="rounded-lg border border-border/60 p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-2 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}
