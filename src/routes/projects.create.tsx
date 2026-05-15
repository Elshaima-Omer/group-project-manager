import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload, Sparkles, CheckCircle2, FileText, Clock, Users, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { lookupClassroomByJoinCode } from "@/lib/classrooms";

export const Route = createFileRoute("/projects/create")({
  head: () => ({ meta: [{ title: "New Project — ScholarSync" }] }),
  component: CreateProject,
});

const ALL_TYPES = ["Coding", "Report Writing", "Presentation", "Research", "Design", "Data Analysis"];

const skillsByType: Record<string, string[]> = {
  Coding: ["Frontend", "Backend", "Database", "Testing"],
  "Report Writing": ["Research", "Proofreading", "Editing", "Referencing"],
  Presentation: ["Design", "Storytelling", "Public Speaking", "Slide Creation"],
  Research: ["Data Gathering", "Analysis", "Writing", "Critical Thinking"],
  Design: ["UI/UX", "Graphic Design", "Prototyping", "Branding"],
  "Data Analysis": ["Statistics", "Data Visualization", "Excel", "Python"],
};

function CreateProject() {
  const navigate = useNavigate();
  const [types, setTypes] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [analyzed, setAnalyzed] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [password, setPassword] = useState("");
  const [classroomCode, setClassroomCode] = useState("");
  const [verifiedClassroom, setVerifiedClassroom] = useState<{ id: string; name: string; professorName?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);

  const availableSkills = Array.from(new Set(types.flatMap((t) => skillsByType[t] || [])));

  const toggleType = (t: string) =>
    setTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const toggleSkill = (s: string) =>
    setSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const handleAnalyze = async () => {
    if (!selectedFile && !description) { toast.error("Upload a project description file or enter a description first."); return; }
    if (types.length === 0) { toast.error("Select at least one project type first."); return; }
    setAnalyzing(true);

    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append("file", selectedFile);
        formData.append("fileName", selectedFile.name);
      }
      formData.append("title", title);
      formData.append("description", description);
      formData.append("deadline", deadline);
      formData.append("types", JSON.stringify(types));

      const response = await fetch("/api/ai-analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "AI analysis failed");
      }

      const result = await response.json();
      setAiResult(result);
      setAnalyzed(true);
      toast.success("AI analysis complete!");
    } catch (error: any) {
      console.error("AI analysis request failed:", error);
      toast.error(error?.message || "AI analysis request failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleVerifyClassroom = async () => {
    setVerifyingCode(true);
    setVerifiedClassroom(null);
    const { classroom, error } = await lookupClassroomByJoinCode(classroomCode);
    setVerifyingCode(false);
    if (error || !classroom) {
      toast.error(error ?? "Classroom not found.");
      return;
    }
    setVerifiedClassroom({
      id: classroom.id,
      name: classroom.name,
      professorName: classroom.profiles?.full_name ?? undefined,
    });
    toast.success(`Linked to ${classroom.name}`);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !deadline || !password) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (!verifiedClassroom) {
      toast.error("Enter your professor's classroom code and click Verify first.");
      return;
    }
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("You must be logged in."); setLoading(false); return; }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        title,
        type: types,
        description,
        password,
        deadline,
        leader_id: user.id,
        classroom_id: verifiedClassroom.id,
      })
      .select()
      .single();

    if (projectError || !project) {
      toast.error("Failed to create project: " + projectError?.message);
      setLoading(false);
      return;
    }

    const { error: memberError } = await supabase
      .from("project_members")
      .insert({
        project_id: project.id,
        user_id: user.id,
        role: "leader",
        status: "accepted",
        skills: skills,
      });

    if (memberError) {
      toast.error("Project created but failed to add you as leader.");
      setLoading(false);
      return;
    }

   // Save AI results to project but don't assign tasks yet
  if (aiResult) {
    await supabase
      .from("projects")
      .update({
        ai_tasks: aiResult.tasks || [],
        ai_timeline: aiResult.timeline || [],
        ai_milestones: aiResult.milestones || [],
        ai_skills: aiResult.skills || [],
      })
      .eq("id", project.id);
      }
    toast.success("Project created — you're now the leader!");
    navigate({ to: "/projects" });
    setLoading(false);
  };

  return (
    <AppShell>
      <Link to="/projects" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to projects
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Create New Project</h1>
        <p className="mt-1 text-sm text-muted-foreground">You'll automatically become the project leader.</p>
      </div>

      <form onSubmit={handleCreate} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-6">
            <h2 className="mb-4 font-display text-lg font-semibold">Project Details</h2>
            <div className="space-y-4">
              <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-4">
                <Label htmlFor="classroom">Professor&apos;s classroom code *</Label>
                <p className="text-xs text-muted-foreground">
                  Ask your professor for the 6-letter code from their Classrooms page.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Input
                    id="classroom"
                    placeholder="e.g. K7M2XP"
                    value={classroomCode}
                    onChange={(e) => {
                      setClassroomCode(e.target.value.toUpperCase());
                      setVerifiedClassroom(null);
                    }}
                    className="max-w-xs font-mono uppercase"
                    required
                  />
                  <Button type="button" variant="outline" onClick={handleVerifyClassroom} disabled={verifyingCode}>
                    {verifyingCode ? "Checking..." : "Verify code"}
                  </Button>
                </div>
                {verifiedClassroom && (
                  <p className="text-sm text-success">
                    ✓ {verifiedClassroom.name}
                    {verifiedClassroom.professorName ? ` · ${verifiedClassroom.professorName}` : ""}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Project title</Label>
                <Input
                  id="title"
                  placeholder="e.g. AI-Powered Study Companion"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Brief description</Label>
                <Textarea
                  id="desc"
                  rows={3}
                  placeholder="What's this project about?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pwd">Project password</Label>
                  <Input
                    id="pwd"
                    type="text"
                    placeholder="Members use this to join"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-2 font-display text-lg font-semibold">Project Type</h2>
            <p className="mb-4 text-xs text-muted-foreground">Select all that apply — skills are generated dynamically.</p>
            <div className="flex flex-wrap gap-2">
              {ALL_TYPES.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => toggleType(t)}
                  className={cn(
                    "rounded-full border-2 px-4 py-1.5 text-sm font-medium transition-all",
                    types.includes(t) ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            {availableSkills.length > 0 && (
              <div className="mt-6">
                <Label className="mb-3 block">Your skills for this project</Label>
                <div className="flex flex-wrap gap-2">
                  {availableSkills.map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => toggleSkill(s)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-all",
                        skills.includes(s) ? "border-primary bg-accent text-accent-foreground" : "border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {skills.includes(s) && "✓ "}{s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 font-display text-lg font-semibold">Project Description File</h2>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-10 text-center transition-colors hover:border-primary/50">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="mt-3 text-sm font-medium">{fileName ?? "Click to upload or drag and drop"}</span>
              <span className="mt-1 text-xs text-muted-foreground">PDF, DOCX, PNG, JPG up to 20MB</span>
              <input
                type="file"
                accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setSelectedFile(file);
                  setFileName(file?.name ?? null);
                }}
              />
            </label>
            <Button type="button" onClick={handleAnalyze} variant="outline" className="mt-4 w-full" disabled={analyzing}>
              <Sparkles className="mr-2 h-4 w-4 text-primary" />
              {analyzing ? "Analyzing..." : "Run AI analysis"}
            </Button>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className={cn("p-6 transition-all", analyzed ? "border-primary/40 bg-gradient-hero" : "")}>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="font-display font-semibold">AI Analysis</h3>
            </div>
            {!analyzed ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Upload your project brief and run analysis to see extracted tasks, suggested timeline, milestones, and recommended skills.
              </p>
            ) : (
              <div className="mt-4 space-y-4 text-sm">
                <Section icon={CheckCircle2} title="Extracted Tasks">
                  {aiResult?.tasks?.map((t: string) => (
                    <div key={t} className="flex items-center gap-2 rounded-md bg-card/50 p-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" /> {t}
                    </div>
                  ))}
                </Section>
                <Section icon={Users} title="Auto Assignments">
                  <p className="text-xs text-muted-foreground">Tasks will be matched to members based on their skills once the team is built.</p>
                </Section>
                <Section icon={Clock} title="Suggested Timeline">
                  <div className="space-y-1.5">
                    {aiResult?.timeline?.map((m: string) => (
                      <div key={m} className="flex items-center gap-2 text-xs">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" /> {m}
                      </div>
                    ))}
                  </div>
                </Section>
                <Section icon={Brain} title="Recommended Skills">
                  <div className="flex flex-wrap gap-1">
                    {aiResult?.skills?.map((s: string) => (
                      <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                    ))}
                  </div>
                </Section>
              </div>
            )}
          </Card>

          <Card className="p-4 border-border/60">
            <p className="text-xs text-muted-foreground">
              After creating the project, share the <strong>Project ID</strong> and <strong>password</strong> with your teammates so they can join.
            </p>
          </Card>

          <Button type="submit" size="lg" className="w-full bg-gradient-primary shadow-elegant" disabled={loading}>
            {loading ? "Creating..." : "Create Project & Become Leader"}
          </Button>
        </div>
      </form>
    </AppShell>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof FileText; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {title}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}