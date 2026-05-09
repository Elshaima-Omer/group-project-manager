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
import { skillsByType, type ProjectType } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/projects/create")({
  head: () => ({ meta: [{ title: "New Project — ScholarSync" }] }),
  component: CreateProject,
});

const ALL_TYPES: ProjectType[] = ["Coding", "Report Writing", "Presentation", "Research", "Design", "Data Analysis"];

function CreateProject() {
  const navigate = useNavigate();
  const [types, setTypes] = useState<ProjectType[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [analyzed, setAnalyzed] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const availableSkills = Array.from(new Set(types.flatMap((t) => skillsByType[t])));

  const toggleType = (t: ProjectType) =>
    setTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const toggleSkill = (s: string) =>
    setSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const handleAnalyze = () => {
    if (!fileName) { toast.error("Upload a project description first."); return; }
    setAnalyzed(true);
    toast.success("AI analysis complete!");
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Project created — you're now the leader!");
    navigate({ to: "/projects" });
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
              <div className="space-y-2">
                <Label htmlFor="title">Project title</Label>
                <Input id="title" placeholder="e.g. AI-Powered Study Companion" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Brief description</Label>
                <Textarea id="desc" rows={3} placeholder="What's this project about?" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input id="deadline" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pwd">Project password</Label>
                  <Input id="pwd" type="text" placeholder="Members use to join" required />
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
                <Label className="mb-3 block">Recommended skills</Label>
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
                accept=".pdf,.docx,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
              />
            </label>
            <Button type="button" onClick={handleAnalyze} variant="outline" className="mt-4 w-full">
              <Sparkles className="mr-2 h-4 w-4 text-primary" /> Run AI analysis
            </Button>
          </Card>
        </div>

        {/* AI panel */}
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
                  {["Research user needs", "Design UI mockups", "Build authentication", "Implement dashboard", "User testing", "Final report"].map((t) => (
                    <div key={t} className="flex items-center gap-2 rounded-md bg-card/50 p-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" /> {t}
                    </div>
                  ))}
                </Section>
                <Section icon={Users} title="Auto Assignments">
                  <p className="text-xs text-muted-foreground">Tasks will be matched to members based on selected skills once team is built.</p>
                </Section>
                <Section icon={Clock} title="Suggested Timeline">
                  <div className="space-y-1.5">
                    {["Week 1: Discovery", "Week 2-3: Design & Build", "Week 4: Testing", "Week 5: Submission"].map((m) => (
                      <div key={m} className="flex items-center gap-2 text-xs">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" /> {m}
                      </div>
                    ))}
                  </div>
                </Section>
                <Section icon={Brain} title="Recommended Skills">
                  <div className="flex flex-wrap gap-1">
                    {availableSkills.slice(0, 5).map((s) => (
                      <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                    ))}
                  </div>
                </Section>
              </div>
            )}
          </Card>

          <Button type="submit" size="lg" className="w-full bg-gradient-primary shadow-elegant">
            Create Project & Become Leader
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
