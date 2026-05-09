import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/status-badge";
import { mockProjects, type Task, type TaskStatus, type Project } from "@/lib/mock-data";
import {
  ArrowLeft, Crown, User, Calendar, Upload, CheckCircle2, X, Sparkles, Clock,
  AlertCircle, FileText, MessageSquare,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects/$projectId")({
  head: ({ params }) => ({ meta: [{ title: `${params.projectId} — ScholarSync` }] }),
  loader: ({ params }) => {
    const project = mockProjects.find((p) => p.id === params.projectId);
    if (!project) throw notFound();
    return { project };
  },
  component: ProjectDetail,
  notFoundComponent: () => (
    <AppShell>
      <Card className="p-12 text-center">
        <h2 className="text-xl font-semibold">Project not found</h2>
        <Link to="/projects" className="mt-4 inline-block text-primary hover:underline">Back to projects</Link>
      </Card>
    </AppShell>
  ),
});

function ProjectDetail() {
  const { project: p } = Route.useLoaderData() as { project: Project };
  const isLeader = p.myRole === "Leader";

  return (
    <AppShell>
      <Link to="/projects" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All projects
      </Link>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{p.id}</span>
            <Badge variant={isLeader ? "default" : "secondary"} className="gap-1">
              {isLeader ? <Crown className="h-3 w-3" /> : <User className="h-3 w-3" />}
              {p.myRole}
            </Badge>
            <StatusBadge status={p.status} />
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold">{p.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{p.description}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {p.type.map((t) => <Badge key={t} variant="outline">{t}</Badge>)}
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" /> Due {p.deadline}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">My Progress</div>
          <div className="mt-2 font-display text-3xl font-bold">{p.myProgress}%</div>
          <Progress value={p.myProgress} className="mt-3 h-1.5" />
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Overall Project Progress</div>
          <div className="mt-2 font-display text-3xl font-bold">{p.progress}%</div>
          <Progress value={p.progress} className="mt-3 h-1.5" />
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Team Size</div>
          <div className="mt-2 font-display text-3xl font-bold">{p.members.length}</div>
          <div className="mt-2 flex -space-x-2">
            {p.members.slice(0, 5).map((m) => (
              <Avatar key={m.id} className="h-7 w-7 border-2 border-background">
                <AvatarImage src={m.avatar} />
                <AvatarFallback>{m.name[0]}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="board" className="mt-6">
        <TabsList>
          <TabsTrigger value="board">Task Board</TabsTrigger>
          <TabsTrigger value="timeline">AI Timeline</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          {isLeader && <TabsTrigger value="team">Team</TabsTrigger>}
          {isLeader && <TabsTrigger value="requests">Requests <Badge variant="destructive" className="ml-1">{p.joinRequests.length}</Badge></TabsTrigger>}
        </TabsList>

        <TabsContent value="board" className="mt-4">
          <KanbanBoard tasks={p.tasks} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-6 lg:col-span-2">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="font-display font-semibold">AI Generated Timeline</h2>
              </div>
              <div className="space-y-3">
                {p.milestones.map((m, i) => (
                  <div key={m.title} className="flex items-center gap-4">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                      m.done ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground border border-border"
                    )}>
                      {m.done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{m.title}</div>
                      <div className="text-xs text-muted-foreground">{m.date}</div>
                    </div>
                    {!m.done && i === p.milestones.findIndex((x) => !x.done) && <Badge>Up next</Badge>}
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-warning-foreground" />
                <h3 className="font-display font-semibold">Deadline Alerts</h3>
              </div>
              <div className="mt-3 space-y-2 text-sm">
                {p.tasks.filter((t) => t.status !== "Approved").slice(0, 4).map((t) => (
                  <div key={t.id} className="rounded-lg border border-border/60 p-3">
                    <div className="text-sm font-medium">{t.title}</div>
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Due {t.deadline}</span>
                      <StatusBadge status={t.priority} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="submissions" className="mt-4">
          <SubmissionsPanel projectId={p.id} submissions={p.submissions} isLeader={isLeader} />
        </TabsContent>

        {isLeader && (
          <TabsContent value="team" className="mt-4">
            <Card className="p-6">
              <h2 className="mb-4 font-display text-lg font-semibold">Team Members & Progress</h2>
              <div className="space-y-3">
                {p.members.map((m) => (
                  <div key={m.id} className="flex flex-wrap items-center gap-4 rounded-lg border border-border/60 p-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={m.avatar} />
                      <AvatarFallback>{m.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{m.name}</span>
                        {m.role === "Leader" && <Crown className="h-3 w-3 text-warning-foreground" />}
                      </div>
                      <div className="text-xs text-muted-foreground">{m.email}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {m.skills.map((s) => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
                      </div>
                    </div>
                    <div className="w-48">
                      <div className="flex justify-between text-xs"><span className="text-muted-foreground">Progress</span><span className="font-medium">{m.progress}%</span></div>
                      <Progress value={m.progress} className="mt-1 h-1.5" />
                    </div>
                    <Badge variant="secondary">{m.contribution}% contribution</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        )}

        {isLeader && (
          <TabsContent value="requests" className="mt-4">
            <Card className="p-6">
              <h2 className="mb-4 font-display text-lg font-semibold">Pending Join Requests</h2>
              {p.joinRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pending requests.</p>
              ) : (
                <div className="space-y-3">
                  {p.joinRequests.map((r) => (
                    <div key={r.id} className="flex flex-wrap items-center gap-4 rounded-lg border border-border/60 p-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={r.avatar} />
                        <AvatarFallback>{r.studentName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold">{r.studentName}</div>
                        <div className="text-xs text-muted-foreground">{r.email} · {r.requestedAt}</div>
                        <div className="mt-1 text-sm italic text-muted-foreground">"{r.message}"</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => toast.error("Request rejected")}><X className="mr-1 h-3 w-3" /> Reject</Button>
                        <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90" onClick={() => toast.success(`${r.studentName} added to team!`)}>
                          <CheckCircle2 className="mr-1 h-3 w-3" /> Accept
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </AppShell>
  );
}

function KanbanBoard({ tasks }: { tasks: Task[] }) {
  const cols: TaskStatus[] = ["Pending", "In Progress", "Submitted", "Approved"];
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cols.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col);
        return (
          <div key={col} className="rounded-xl bg-secondary/40 p-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold">{col}</h3>
              <Badge variant="secondary">{colTasks.length}</Badge>
            </div>
            <div className="space-y-2">
              {colTasks.map((t) => (
                <Card key={t.id} className="cursor-grab p-3 transition-shadow hover:shadow-card active:cursor-grabbing">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-medium leading-snug">{t.title}</div>
                    <StatusBadge status={t.priority} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t.assigneeName.split(" ")[0]}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{t.deadline.slice(5)}</span>
                  </div>
                  {t.progress > 0 && t.progress < 100 && (
                    <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-gradient-primary" style={{ width: `${t.progress}%` }} />
                    </div>
                  )}
                </Card>
              ))}
              {colTasks.length === 0 && <div className="rounded-lg border-2 border-dashed border-border/40 p-4 text-center text-xs text-muted-foreground">Empty</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SubmissionsPanel({ submissions, isLeader }: { projectId: string; submissions: any[]; isLeader: boolean }) {
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="p-6 lg:col-span-2">
        <h2 className="mb-4 font-display text-lg font-semibold">{isLeader ? "Team Submissions" : "Recent Submissions"}</h2>
        {submissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No submissions yet.</p>
        ) : (
          <div className="space-y-3">
            {submissions.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 p-3">
                <FileText className="h-5 w-5 text-primary" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{s.taskTitle}</div>
                  <div className="text-xs text-muted-foreground">{s.fileName} · by {s.member} · {s.uploadedAt}</div>
                </div>
                {s.status === "Pending" && isLeader ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => toast.message("Feedback sent to member")}><MessageSquare className="mr-1 h-3 w-3" /> Needs changes</Button>
                    <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90" onClick={() => toast.success("Submission approved!")}>
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Accept
                    </Button>
                  </div>
                ) : (
                  <Badge variant={s.status === "Accepted" ? "default" : "secondary"}>{s.status}</Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-display text-lg font-semibold">Submit Your Work</h2>
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary/50">
          <Upload className="h-7 w-7 text-muted-foreground" />
          <span className="mt-2 text-sm font-medium">{fileName ?? "Upload file"}</span>
          <span className="mt-1 text-xs text-muted-foreground">PDF, DOCX, ZIP, Images</span>
          <input type="file" className="hidden" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)} />
        </label>
        <Button
          className="mt-4 w-full bg-gradient-primary"
          onClick={() => { if (fileName) toast.success("Submission sent for review!"); else toast.error("Pick a file first"); }}
        >
          Submit for review
        </Button>
      </Card>
    </div>
  );
}
