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
  AlertCircle, FileText, MessageSquare, Download, ExternalLink,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { notifyUser, getSubmissionSubmitterId } from "@/lib/notifications";
import {
  uploadSubmissionFile,
  getSubmissionDownloadUrl,
  displayFileName,
  isStoragePath,
} from "@/lib/submission-storage";

export const Route = createFileRoute("/projects/$projectId")({
  head: () => ({ meta: [{ title: `Project — ScholarSync` }] }),
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
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [mySkills, setMySkills] = useState<string[]>([]);
  const [skillsSaved, setSkillsSaved] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUser(user);

    // Get full project data including AI results
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

    // Load my existing skills if already selected
    if (membership?.skills?.length > 0) {
      setMySkills(membership.skills);
      setSkillsSaved(true);
    }

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
    const taskIds = (tasksData || []).map((t: any) => t.id);
    if (taskIds.length > 0) {
      const { data: subsData } = await supabase
        .from("submissions")
        .select("*, tasks(title), profiles(id, full_name)")
        .in("task_id", taskIds);
      setSubmissions(subsData || []);
    } else {
      setSubmissions([]);
    }

    setLoading(false);
  };

  const handleAcceptRequest = async (memberId: string, userName: string, userId: string) => {
    const { error } = await supabase
      .from("project_members")
      .update({ status: "accepted" })
      .eq("id", memberId);
    if (error) { toast.error("Failed to accept request"); return; }

    await notifyUser({
      userId,
      type: "join_accepted",
      message: `You were accepted into "${project?.title || "the project"}".`,
    });

    toast.success(`${userName} added to the team!`);
    loadProject();
  };

  const handleRejectRequest = async (memberId: string, userName: string, userId: string) => {
    const { error } = await supabase
      .from("project_members")
      .update({ status: "rejected" })
      .eq("id", memberId);
    if (error) { toast.error("Failed to reject request"); return; }

    await notifyUser({
      userId,
      type: "join_rejected",
      message: `Your request to join "${project?.title || "the project"}" was not accepted.`,
    });

    toast.success("Request rejected.");
    loadProject();
  };

  const resolveSubmitterUserId = async (
    submissionId: string,
    taskId: string,
    submitterUserId?: string,
  ): Promise<string | undefined> => {
    if (submitterUserId) return submitterUserId;

    const fromState = submissions.find((s) => s.id === submissionId);
    const fromStateId = fromState ? getSubmissionSubmitterId(fromState) : undefined;
    if (fromStateId) return fromStateId;

    const { data: row } = await supabase
      .from("submissions")
      .select("submitted_by, user_id")
      .eq("id", submissionId)
      .single();

    if (row) {
      const id = row.submitted_by ?? row.user_id;
      if (id) return id;
    }

    const task = tasks.find((t) => t.id === taskId);
    return task?.assigned_to ?? undefined;
  };

  const handleApproveSubmission = async (
    submissionId: string,
    taskId: string,
    submitterUserId?: string,
  ) => {
    const task = tasks.find((t) => t.id === taskId);
    const memberId = await resolveSubmitterUserId(submissionId, taskId, submitterUserId);

    await supabase.from("submissions").update({ status: "accepted" }).eq("id", submissionId);
    await supabase.from("tasks").update({ status: "approved", progress: 100 }).eq("id", taskId);

    if (memberId) {
      await notifyUser({
        userId: memberId,
        type: "submission_approved",
        message: `Your work on "${task?.title || "a task"}" in "${project?.title || "the project"}" was approved.`,
      });
    } else {
      toast.error("Work approved, but the student could not be notified (submitter unknown).");
    }

    toast.success("Submission approved!");
    loadProject();
  };

  const handleRejectSubmission = async (submissionId: string, submitterUserId?: string) => {
    const submission = submissions.find((s) => s.id === submissionId);
    const taskId = submission?.task_id as string | undefined;
    const taskTitle = submission?.tasks?.title || tasks.find((t) => t.id === taskId)?.title;
    const memberId = taskId
      ? await resolveSubmitterUserId(submissionId, taskId, submitterUserId)
      : submitterUserId;

    await supabase.from("submissions").update({ status: "needs_changes" }).eq("id", submissionId);

    if (memberId) {
      await notifyUser({
        userId: memberId,
        type: "submission_rejected",
        message: `Your submission for "${taskTitle || "a task"}" in "${project?.title || "the project"}" needs changes. Please revise and resubmit.`,
      });
    } else {
      toast.error("Feedback saved, but the student could not be notified (submitter unknown).");
    }

    toast.message("Feedback sent to member.");
    loadProject();
  };

  const handleSaveSkills = async () => {
    if (mySkills.length === 0) {
      toast.error("Please select at least one skill.");
      return;
    }
    const { error } = await supabase
      .from("project_members")
      .update({ skills: mySkills })
      .eq("project_id", projectId)
      .eq("user_id", currentUser?.id);

    if (error) { toast.error("Failed to save skills."); return; }
    setSkillsSaved(true);
    toast.success("Skills saved!");
    loadProject();
  };

  const handleAssignTasks = async () => {
    if (!project?.ai_tasks?.length) {
      toast.error("No AI tasks found. Run AI analysis when creating the project first.");
      return;
    }

    const membersWithSkills = members.filter((m) => m.skills?.length > 0);
    const membersWithoutSkills = members.filter((m) => m.role !== "leader" && (!m.skills || m.skills.length === 0));

    if (membersWithSkills.length === 0) {
      toast.error("No members have selected their skills yet.");
      return;
    }

    if (membersWithoutSkills.length > 0) {
      toast.error(
        `${membersWithoutSkills.length} member${membersWithoutSkills.length === 1 ? "" : "s"} haven't selected skills yet. Wait for them before assigning tasks.`
      );
      return;
    }

    setAssigning(true);

    const memberData = membersWithSkills.map((m) => ({
      name: m.profiles?.full_name || "Unknown",
      skills: m.skills || [],
      userId: m.user_id,
    }));

    try {
      const { divideTasks } = await import("@/lib/gemini");
      const result = await divideTasks(
        memberData,
        project.title,
        project.type || [],
        project.ai_tasks
      );

      // Delete old unassigned tasks first to avoid duplicates
      await supabase.from("tasks").delete().eq("project_id", projectId);

      // Save newly assigned tasks
      const taskInserts = result.assignments.map((a: any) => {
        const member = memberData.find((m) => m.name === a.assignedTo);
        return {
          project_id: projectId,
          assigned_to: member?.userId || currentUser?.id,
          title: a.task,
          description: a.reason,
          status: "pending",
          priority: "medium",
          deadline: project.deadline,
        };
      });

      await supabase.from("tasks").insert(taskInserts);
      await supabase.from("projects").update({ tasks_assigned: true }).eq("id", projectId);

      toast.success("Tasks assigned to members based on their skills!");
      loadProject();
    } catch (err) {
      toast.error("Failed to assign tasks. Please try again.");
    }

    setAssigning(false);
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
  const leaderUserId = project?.leader_id ?? members.find((m) => m.role === "leader")?.user_id;
  const membersWithoutSkills = members.filter((m) => m.role !== "leader" && (!m.skills || m.skills.length === 0));
  const currentMemberName =
    members.find((m) => m.user_id === currentUser?.id)?.profiles?.full_name || "A team member";
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

      {/* Skills selection for members who haven't selected yet */}
      {!isLeader && !skillsSaved && (
        <Card className="mb-6 border-primary/30 bg-gradient-hero p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="font-display font-semibold">Select Your Skills</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Select the skills you bring to this project. The leader will use these to assign tasks to you.
          </p>
          <div className="flex flex-wrap gap-2">
            {(project?.ai_skills?.length > 0 ? project.ai_skills : [
              "Research", "Writing", "Design", "Coding", "Analysis",
              "Presentation", "Testing", "Documentation"
            ]).map((skill: string) => (
              <button
                key={skill}
                type="button"
                onClick={() => setMySkills((prev) =>
                  prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
                )}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                  mySkills.includes(skill)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {mySkills.includes(skill) && "✓ "}{skill}
              </button>
            ))}
          </div>
          <Button className="mt-4 bg-gradient-primary" onClick={handleSaveSkills}>
            Save My Skills
          </Button>
        </Card>
      )}

      {/* Skills saved confirmation */}
      {!isLeader && skillsSaved && (
        <Card className="mb-6 border-success/30 bg-success/5 p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="text-sm font-medium">Skills saved</span>
            <div className="flex flex-wrap gap-1 ml-2">
              {mySkills.map((s) => (
                <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-xs"
              onClick={() => setSkillsSaved(false)}
            >
              Edit
            </Button>
          </div>
        </Card>
      )}

      {/* Assign tasks button for leader */}
      {isLeader && !project?.tasks_assigned && members.length > 1 && (
        <Card className="mb-6 border-primary/30 bg-gradient-hero p-6">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="font-display font-semibold">Ready to Assign Tasks?</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-1">
            Members with skills selected: {members.filter((m) => m.skills?.length > 0).length}/{members.length}
          </p>
          {membersWithoutSkills.length > 0 && (
            <p className="text-xs text-warning-foreground mb-3">
              ⚠️ {membersWithoutSkills.length} member{membersWithoutSkills.length === 1 ? "" : "s"} haven't selected their skills yet. You can still assign or wait for them.
            </p>
          )}
          <Button
            className="bg-gradient-primary"
            onClick={handleAssignTasks}
            disabled={assigning || membersWithoutSkills.length > 0}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {assigning ? "AI is assigning tasks..." : "Assign Tasks with AI"}
          </Button>
        </Card>
      )}

      {/* Tasks already assigned notice */}
      {isLeader && project?.tasks_assigned && (
        <Card className="mb-6 border-success/30 bg-success/5 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="text-sm font-medium">Tasks have been assigned to all members</span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-xs"
              onClick={handleAssignTasks}
              disabled={assigning}
            >
              {assigning ? "Reassigning..." : "Reassign"}
            </Button>
          </div>
        </Card>
      )}

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
          <KanbanBoard
            tasks={tasks}
            currentUserId={currentUser?.id}
            isLeader={isLeader}
            onUpdate={loadProject}
          />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-6 lg:col-span-2">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="font-display font-semibold">AI Generated Timeline</h2>
              </div>
              {!project?.ai_timeline?.length ? (
                <p className="text-sm text-muted-foreground">No timeline yet. Run AI analysis when creating a project.</p>
              ) : (
                <div className="space-y-3">
                  {project.ai_timeline.map((item: string, i: number) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{item}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {project?.ai_milestones?.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-3 font-display font-semibold text-sm">Milestones</h3>
                  <div className="space-y-2">
                    {project.ai_milestones.map((m: string, i: number) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                          i < Math.ceil(overallProgress / (100 / project.ai_milestones.length))
                            ? "bg-success text-success-foreground"
                            : "bg-muted text-muted-foreground border border-border"
                        )}>
                          {i < Math.ceil(overallProgress / (100 / project.ai_milestones.length))
                            ? <CheckCircle2 className="h-3 w-3" />
                            : i + 1
                          }
                        </div>
                        <span className="text-sm">{m}</span>
                      </div>
                    ))}
                  </div>
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
                {tasks.length === 0 && (
                  <p className="text-sm text-muted-foreground">No tasks yet.</p>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="submissions" className="mt-4">
          <SubmissionsPanel
            projectId={projectId}
            tasks={isLeader ? tasks : myTasks}
            submissions={submissions}
            isLeader={isLeader}
            currentUserId={currentUser?.id}
            leaderUserId={leaderUserId}
            projectTitle={project?.title || "Project"}
            memberName={currentMemberName}
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
                          {(m.skills || []).length > 0
                            ? (m.skills || []).map((s: string) => (
                                <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                              ))
                            : <span className="text-xs text-muted-foreground">No skills selected yet</span>
                          }
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectRequest(r.id, r.profiles?.full_name || "Student", r.user_id)}
                        >
                          <X className="mr-1 h-3 w-3" /> Reject
                        </Button>
                        <Button
                          size="sm"
                          className="bg-success text-success-foreground hover:bg-success/90"
                          onClick={() => handleAcceptRequest(r.id, r.profiles?.full_name || "Student", r.user_id)}
                        >
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
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />{t.deadline?.slice(5) || "No date"}
                    </span>
                  </div>
                  {t.progress > 0 && (
                    <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-gradient-primary" style={{ width: `${t.progress}%` }} />
                    </div>
                  )}
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
                <div className="rounded-lg border-2 border-dashed border-border/40 p-4 text-center text-xs text-muted-foreground">
                  Empty
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SubmissionsPanel({
  projectId,
  tasks,
  submissions,
  isLeader,
  currentUserId,
  leaderUserId,
  projectTitle,
  memberName,
  onApprove,
  onReject,
  onSubmitted,
}: {
  projectId: string;
  tasks: any[];
  submissions: any[];
  isLeader: boolean;
  currentUserId: string;
  leaderUserId?: string;
  projectTitle: string;
  memberName: string;
  onApprove: (id: string, taskId: string, submitterUserId?: string) => void;
  onReject: (id: string, submitterUserId?: string) => void;
  onSubmitted: () => void;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTask, setSelectedTask] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [openingFile, setOpeningFile] = useState<string | null>(null);

  const handleOpenFile = async (fileUrlOrPath: string, download = false) => {
    setOpeningFile(fileUrlOrPath);
    const { url, error } = await getSubmissionDownloadUrl(fileUrlOrPath);
    setOpeningFile(null);

    if (error || !url) {
      if (!isStoragePath(fileUrlOrPath)) {
        toast.error(error ?? "Could not open file.");
      } else {
        toast.error(
          "This file was submitted before upload was enabled — ask the member to submit again.",
        );
      }
      return;
    }

    if (download) {
      const link = document.createElement("a");
      link.href = url;
      link.download = displayFileName(fileUrlOrPath);
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !selectedTask) {
      toast.error("Pick a file and select a task first.");
      return;
    }
    setUploading(true);

    const { path, error: uploadError } = await uploadSubmissionFile(
      projectId,
      selectedTask,
      currentUserId,
      selectedFile,
    );

    if (uploadError || !path) {
      toast.error(
        uploadError?.includes("Bucket not found")
          ? "File storage is not set up. Run supabase/submissions-storage.sql in Supabase."
          : `Upload failed: ${uploadError}`,
      );
      setUploading(false);
      return;
    }

    const { error } = await supabase.from("submissions").insert({
      task_id: selectedTask,
      submitted_by: currentUserId,
      file_url: path,
      description: selectedFile.name,
      status: "pending",
    });

    if (error) {
      toast.error("Failed to submit: " + error.message);
    } else {
      await supabase.from("tasks").update({ status: "submitted", progress: 80 }).eq("id", selectedTask);
      const taskTitle = tasks.find((t) => t.id === selectedTask)?.title || "a task";
      if (leaderUserId && leaderUserId !== currentUserId) {
        await notifyUser({
          userId: leaderUserId,
          type: "submission_received",
          message: `${memberName} submitted work for "${taskTitle}" in "${projectTitle}".`,
        });
      }
      toast.success("Submission sent for review!");
      setSelectedFile(null);
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
                    {displayFileName(s.file_url)} · by {s.profiles?.full_name || "Member"} ·{" "}
                    {new Date(s.submitted_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={openingFile === s.file_url}
                    onClick={() => handleOpenFile(s.file_url, false)}
                  >
                    <ExternalLink className="mr-1 h-3 w-3" />
                    {openingFile === s.file_url ? "Opening..." : "View"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={openingFile === s.file_url}
                    onClick={() => handleOpenFile(s.file_url, true)}
                  >
                    <Download className="mr-1 h-3 w-3" /> Download
                  </Button>
                  {s.status === "pending" && isLeader ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onReject(s.id, getSubmissionSubmitterId(s))}
                      >
                        <MessageSquare className="mr-1 h-3 w-3" /> Needs changes
                      </Button>
                      <Button
                        size="sm"
                        className="bg-success text-success-foreground hover:bg-success/90"
                        onClick={() => onApprove(s.id, s.task_id, getSubmissionSubmitterId(s))}
                      >
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Accept
                      </Button>
                    </>
                  ) : (
                    <Badge variant={s.status === "accepted" ? "default" : "secondary"}>{s.status}</Badge>
                  )}
                </div>
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
          <span className="mt-2 text-sm font-medium">{selectedFile?.name ?? "Upload file"}</span>
          <span className="mt-1 text-xs text-muted-foreground">PDF, DOCX, ZIP, Images</span>
          <input
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.zip,.png,.jpg,.jpeg,.webp"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <Button className="mt-4 w-full bg-gradient-primary" onClick={handleSubmit} disabled={uploading}>
          {uploading ? "Submitting..." : "Submit for review"}
        </Button>
      </Card>
    </div>
  );
}