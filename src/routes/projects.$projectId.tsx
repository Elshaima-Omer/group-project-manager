import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft, Crown, User, Calendar, Upload, CheckCircle2, X, Sparkles, Clock,
  AlertCircle, FileText, MessageSquare,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects/$projectId")({
  head: ({ params }) => ({ meta: [{ title: `Project — ScholarSync` }] }),
  component: ProjectDetail,
});

function ProjectDetail() {
  const { projectId } = Route.useParams();
  const [project, setProject] = useState<any>(null);
  const [myMembership, setMyMembership] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUser(user);

    // Get project details
    const { data: projectData } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();
    setProject(projectData);

    // Get my membership
    const { data: membership } = await supabase
      .from("project_members")
      .select("*")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .single();
    setMyMembership(membership);

    // Get all accepted members with profiles
    const { data: membersData } = await supabase
      .from("project_members")
      .select("*, profiles(*)")
      .eq("project_id", projectId)
      .eq("status", "accepted");
    setMembers(membersData || []);


   // Get pending join requests with profiles
const { data: requestsData } = await supabase
  .from("project_members")
  .select("*, profiles(*)")
  .eq("project_id", projectId)
  .eq("status", "pending");

// Manually fetch profiles if they didn't join
const requestsWithProfiles = await Promise.all((requestsData || []).map(async (r) => {
  if (r.profiles) return r;
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", r.user_id)
    .single();
  return { ...r, profiles: profile };
}));
setJoinRequests(requestsWithProfiles);

    // Get tasks
    const { data: tasksData } = await supabase
      .from("tasks")
      .select("*, profiles(full_name)")
      .eq("project_id", projectId);
    setTasks(tasksData || []);

    // Get submissions
    const { data: subsData } = await supabase
      .from("submissions")
      .select("*, tasks(title), profiles(full_name)")
      .in("task_id", (tasksData || []).map((t: any) => t.id));
    setSubmissions(subsData || []);

    setLoading(false);
  };

  const handleAcceptRequest = async (memberId: string, userName: string) => {
    const { error } = await supabase
      .from("project_members")
      .update({ status: "accepted" })
      .eq("id", memberId);

    if (error) { toast.error("Failed to accept request"); return; }
    toast.success(`${userName} added to the team!`);
    loadProject();
  };

  const handleRejectRequest = async (memberId: string) => {
    const { error } = await supabase
      .from("project_members")
      .update({ status: "rejected" })
      .eq("id", memberId);

    if (error) { toast.error("Failed to reject request"); return; }
    toast.success("Request rejected.");
    loadProject();
  };

  const handleApproveSubmission = async (submissionId: string, taskId: string) => {
    await supabase.from("submissions").update({ status: "accepted" }).eq("id", submissionId);
    await supabase.from("tasks").update({ status: "approved", progress: 100 }).eq("id", taskId);
    toast.success("Submission approved!");
    loadProject();
  };

  const handleRejectSubmission = async (submissionId: string) => {
    await supabase.from("submissions").update({ status: "needs_changes" }).eq("id", submissionId);
    toast.message("Feedback sent to member.");
    loadProject();
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </AppShell>
    );
  }

  if (!project) {
    return (
      <AppShell>
        <Card className="p-12 text-center">
          <h2 className="text-xl font-semibold">Project not found</h2>
          <Link to="/projects" className="mt-4 inline-block text-primary hover:underline">Back to projects</Link>
        </Card>
      </AppShell>
    );
  }

  const isLeader = myMembership?.role === "leader";
  const myTasks = tasks.filter((t) => t.assigned_to === currentUser?.id);
  const myProgress = myTasks.length > 0
    ? Math.round(myTasks.reduce((s: number, t: any) => s + (t.progress || 0), 0) / myTasks.length)
    : 0;
  const overallProgress = tasks.length > 0
    ? Math.round(tasks.reduce((s: number, t: any) => s + (t.progress || 0), 0) / tasks.length)
    : 0;

  return (
    <AppShell>
      <Link to="/projects" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All projects
      </Link>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{project.id?.slice(0, 8).toUpperCase()}</span>
            <Badge variant={isLeader ? "default" : "secondary"} className="gap-1">
              {isLeader ? <Crown className="h-3 w-3" /> : <User className="h-3 w-3" />}
              {isLeader ? "Leader" : "Member"}
            </Badge>
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold">{project.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{project.description}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(project.type || []).map((t: string) => <Badge key={t} variant="outline">{t}</Badge>)}
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" /> Due {project.deadline}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">My Progress</div>
          <div className="mt-2 font-display text-3xl font-bold">{myProgress}%</div>
          <Progress value={myProgress} className="mt-3 h-1.5" />
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Overall Project Progress</div>
          <div className="mt-2 font-display text-3xl font-bold">{overallProgress}%</div>
          <Progress value={overallProgress} className="mt-3 h-1.5" />
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Team Size</div>
          <div className="mt-2 font-display text-3xl font-bold">{members.length}</div>
          <div className="mt-2 flex -space-x-2">
            {members.slice(0, 5).map((m) => (
              <Avatar key={m.id} className="h-7 w-7 border-2 border-background">
                <AvatarFallback>{m.profiles?.full_name?.[0] || "?"}</AvatarFallback>
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
          {isLeader && (
            <TabsTrigger value="requests">
              Requests
              {joinRequests.length > 0 && (
                <Badge variant="destructive" className="ml-1">{joinRequests.length}</Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="board" className="mt-4">
          <KanbanBoard tasks={tasks} currentUserId={currentUser?.id} isLeader={isLeader} onUpdate={loadProject} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-6 lg:col-span-2">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="font-display font-semibold">AI Generated Timeline</h2>
              </div>
              {milestones.length === 0 ? (
                <p className="text-sm text-muted-foreground">No milestones yet. Run AI analysis when creating a project to generate a timeline.</p>
              ) : (
                <div className="space-y-3">
                  {milestones.map((m: any, i: number) => (
                    <div key={m.id} className="flex items-center gap-4">
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
                    </div>
                  ))}
                </div>
              )}
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-warning-foreground" />
                <h3 className="font-display font-semibold">Deadline Alerts</h3>
              </div>
              <div className="mt-3 space-y-2 text-sm">
                {tasks.filter((t) => t.status !== "approved").slice(0, 4).map((t) => (
                  <div key={t.id} className="rounded-lg border border-border/60 p-3">
                    <div className="text-sm font-medium">{t.title}</div>
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Due {t.deadline}</span>
                      <Badge variant="secondary">{t.priority}</Badge>
                    </div>
                  </div>
                ))}
                {tasks.length === 0 && <p className="text-sm text-muted-foreground">No tasks yet.</p>}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="submissions" className="mt-4">
          <SubmissionsPanel
            tasks={isLeader ? tasks : myTasks}
            submissions={submissions}
            isLeader={isLeader}
            currentUserId={currentUser?.id}
            onApprove={handleApproveSubmission}
            onReject={handleRejectSubmission}
            onSubmitted={loadProject}
          />
        </TabsContent>

        {isLeader && (
          <TabsContent value="team" className="mt-4">
            <Card className="p-6">
              <h2 className="mb-4 font-display text-lg font-semibold">Team Members & Progress</h2>
              <div className="space-y-3">
                {members.map((m) => {
                  const memberTasks = tasks.filter((t) => t.assigned_to === m.user_id);
                  const memberProgress = memberTasks.length > 0
                    ? Math.round(memberTasks.reduce((s: number, t: any) => s + (t.progress || 0), 0) / memberTasks.length)
                    : 0;
                  return (
                    <div key={m.id} className="flex flex-wrap items-center gap-4 rounded-lg border border-border/60 p-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{m.profiles?.full_name?.[0] || "?"}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{m.profiles?.full_name || "Unknown"}</span>
                          {m.role === "leader" && <Crown className="h-3 w-3 text-warning-foreground" />}
                        </div>
                        <div className="text-xs text-muted-foreground">{m.profiles?.email}</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {(m.skills || []).map((s: string) => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
                        </div>
                      </div>
                      <div className="w-48">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{memberProgress}%</span>
                        </div>
                        <Progress value={memberProgress} className="mt-1 h-1.5" />
                      </div>
                      <Badge variant="secondary">{memberTasks.length} tasks</Badge>
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>
        )}

        {isLeader && (
          <TabsContent value="requests" className="mt-4">
            <Card className="p-6">
              <h2 className="mb-4 font-display text-lg font-semibold">Pending Join Requests</h2>
              {joinRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pending requests.</p>
              ) : (
                <div className="space-y-3">
                  {joinRequests.map((r) => (
                    <div key={r.id} className="flex flex-wrap items-center gap-4 rounded-lg border border-border/60 p-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{r.profiles?.full_name?.[0] || "?"}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold">{r.profiles?.full_name || "Unknown"}</div>
                        <div className="text-xs text-muted-foreground">{r.profiles?.email}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleRejectRequest(r.id)}>
                          <X className="mr-1 h-3 w-3" /> Reject
                        </Button>
                        <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90"
                          onClick={() => handleAcceptRequest(r.id, r.profiles?.full_name)}>
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

function KanbanBoard({ tasks, currentUserId, isLeader, onUpdate }: {
  tasks: any[]; currentUserId: string; isLeader: boolean; onUpdate: () => void;
}) {
  const cols = ["pending", "in_progress", "submitted", "approved"];
  const colLabels: Record<string, string> = {
    pending: "Pending", in_progress: "In Progress", submitted: "Submitted", approved: "Approved"
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId);
    onUpdate();
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cols.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col);
        return (
          <div key={col} className="rounded-xl bg-secondary/40 p-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold">{colLabels[col]}</h3>
              <Badge variant="secondary">{colTasks.length}</Badge>
            </div>
            <div className="space-y-2">
              {colTasks.map((t) => (
                <Card key={t.id} className="p-3 transition-shadow hover:shadow-card">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-medium leading-snug">{t.title}</div>
                    <Badge variant="secondary" className="text-[10px]">{t.priority}</Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t.profiles?.full_name?.split(" ")[0] || "Unassigned"}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{t.deadline?.slice(5) || "No date"}</span>
                  </div>
                  {t.progress > 0 && (
                    <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-gradient-primary" style={{ width: `${t.progress}%` }} />
                    </div>
                  )}
                  {/* Allow member to move their own task, leader can move any */}
                  {(isLeader || t.assigned_to === currentUserId) && col !== "approved" && (
                    <div className="mt-2 flex gap-1">
                      {col === "pending" && (
                        <Button size="sm" variant="outline" className="h-6 text-[10px] px-2"
                          onClick={() => updateTaskStatus(t.id, "in_progress")}>
                          Start
                        </Button>
                      )}
                      {col === "in_progress" && (
                        <Button size="sm" variant="outline" className="h-6 text-[10px] px-2"
                          onClick={() => updateTaskStatus(t.id, "submitted")}>
                          Submit
                        </Button>
                      )}
                      {col === "submitted" && isLeader && (
                        <Button size="sm" variant="outline" className="h-6 text-[10px] px-2"
                          onClick={() => updateTaskStatus(t.id, "approved")}>
                          Approve
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              ))}
              {colTasks.length === 0 && (
                <div className="rounded-lg border-2 border-dashed border-border/40 p-4 text-center text-xs text-muted-foreground">Empty</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SubmissionsPanel({ tasks, submissions, isLeader, currentUserId, onApprove, onReject, onSubmitted }: {
  tasks: any[]; submissions: any[]; isLeader: boolean;
  currentUserId: string; onApprove: (id: string, taskId: string) => void;
  onReject: (id: string) => void; onSubmitted: () => void;
}) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTask, setSelectedTask] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async () => {
    if (!fileName || !selectedTask) {
      toast.error("Pick a file and select a task first.");
      return;
    }
    setUploading(true);

    const { error } = await supabase.from("submissions").insert({
      task_id: selectedTask,
      submitted_by: currentUserId,
      file_url: fileName,
      description: fileName,
      status: "pending",
    });

    if (error) {
      toast.error("Failed to submit: " + error.message);
    } else {
      await supabase.from("tasks").update({ status: "submitted", progress: 80 }).eq("id", selectedTask);
      toast.success("Submission sent for review!");
      setFileName(null);
      setSelectedTask("");
      onSubmitted();
    }

    setUploading(false);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="p-6 lg:col-span-2">
        <h2 className="mb-4 font-display text-lg font-semibold">
          {isLeader ? "Team Submissions" : "My Submissions"}
        </h2>
        {submissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No submissions yet.</p>
        ) : (
          <div className="space-y-3">
            {submissions.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 p-3">
                <FileText className="h-5 w-5 text-primary" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{s.tasks?.title || "Task"}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.file_url} · by {s.profiles?.full_name || "Member"} · {new Date(s.submitted_at).toLocaleDateString()}
                  </div>
                </div>
                {s.status === "pending" && isLeader ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => onReject(s.id)}>
                      <MessageSquare className="mr-1 h-3 w-3" /> Needs changes
                    </Button>
                    <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90"
                      onClick={() => onApprove(s.id, s.task_id)}>
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Accept
                    </Button>
                  </div>
                ) : (
                  <Badge variant={s.status === "accepted" ? "default" : "secondary"}>{s.status}</Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-display text-lg font-semibold">Submit Your Work</h2>
        <div className="mb-3 space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Select task</label>
          <select
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={selectedTask}
            onChange={(e) => setSelectedTask(e.target.value)}
          >
            <option value="">Choose a task...</option>
            {tasks.filter((t) => t.assigned_to === currentUserId && t.status !== "approved").map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary/50">
          <Upload className="h-7 w-7 text-muted-foreground" />
          <span className="mt-2 text-sm font-medium">{fileName ?? "Upload file"}</span>
          <span className="mt-1 text-xs text-muted-foreground">PDF, DOCX, ZIP, Images</span>
          <input
            type="file"
            className="hidden"
            onChange={(e) => {
              setSelectedFile(e.target.files?.[0] || null);
              setFileName(e.target.files?.[0]?.name ?? null);
            }}
          />
        </label>
        <Button className="mt-4 w-full bg-gradient-primary" onClick={handleSubmit} disabled={uploading}>
          {uploading ? "Submitting..." : "Submit for review"}
        </Button>
      </Card>
    </div>
  );
}