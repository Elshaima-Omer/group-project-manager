import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  GraduationCap,
  Sparkles,
  Users,
  Brain,
  CheckCircle2,
  ArrowRight,
  FileText,
  Calendar,
  Trophy,
  Quote,
  Star,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ScholarSync — AI Project Management for University Teams" },
      { name: "description", content: "ScholarSync helps students and professors manage group projects with AI-driven task allocation, timelines, and submissions." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">ScholarSync</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#features" className="text-muted-foreground hover:text-foreground">Features</a>
            <a href="#stats" className="text-muted-foreground hover:text-foreground">Impact</a>
            <a href="#testimonials" className="text-muted-foreground hover:text-foreground">Reviews</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
            <Link to="/signup"><Button size="sm" className="bg-gradient-primary shadow-elegant">Get started</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Built for universities · Powered by AI
            </div>
            <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
              Group projects, <span className="text-gradient">finally organized.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              ScholarSync turns chaotic group work into focused collaboration. AI breaks down briefs into tasks,
              builds timelines, and keeps everyone — students and professors — perfectly in sync.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link to="/signup">
                <Button size="lg" className="bg-gradient-primary shadow-elegant">
                  Start your project <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline">Log in</Button>
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">No credit card · Free for students</p>
          </div>

          {/* Hero Preview */}
          <div className="relative mx-auto mt-16 max-w-5xl">
            <div className="glass rounded-2xl p-3 shadow-elegant">
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { icon: Brain, label: "AI Tasks Generated", value: "1,284" },
                    { icon: Trophy, label: "Avg Project Score", value: "92%" },
                    { icon: Users, label: "Active Teams", value: "320" },
                  ].map((s, i) => (
                    <div key={i} className="rounded-lg border border-border/60 bg-background/50 p-4">
                      <s.icon className="h-5 w-5 text-primary" />
                      <div className="mt-3 text-2xl font-bold">{s.value}</div>
                      <div className="text-xs text-muted-foreground">{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-border/60 bg-background/50 p-4">
                    <div className="mb-3 text-xs font-semibold text-muted-foreground">AI TIMELINE — Campus Nav App</div>
                    <div className="space-y-2">
                      {["Research", "Design", "MVP", "Testing"].map((m, i) => (
                        <div key={m} className="flex items-center gap-3">
                          <div className="text-xs font-medium w-16">{m}</div>
                          <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-gradient-primary" style={{ width: `${100 - i * 22}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background/50 p-4">
                    <div className="mb-3 text-xs font-semibold text-muted-foreground">RECENT TASKS</div>
                    <ul className="space-y-2 text-sm">
                      {["Set up auth API", "Design landing page", "Write lit review", "Schema design"].map((t) => (
                        <li key={t} className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-success" /> {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-bold md:text-5xl">Everything your team needs</h2>
            <p className="mt-4 text-muted-foreground">From the first brief to the final submission — all in one place.</p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Brain, title: "AI Task Breakdown", desc: "Upload a project brief and AI extracts tasks, timelines, and recommended skills automatically." },
              { icon: Users, title: "Smart Team Roles", desc: "Project leaders manage members, approvals, and reassignments. Members focus on their tasks." },
              { icon: Calendar, title: "AI Timeline & Milestones", desc: "Generated milestones keep your team on track with deadline alerts and visual progress." },
              { icon: FileText, title: "Submission Workflow", desc: "Members upload work, leaders review and approve — progress updates automatically." },
              { icon: GraduationCap, title: "Professor Dashboard", desc: "Professors monitor groups, contributions, and download AI-generated final reports." },
              { icon: Sparkles, title: "Dynamic Skill Matching", desc: "Skills adapt to project type — coding, research, design — so the right people own the right tasks." },
            ].map((f) => (
              <Card key={f.title} className="group border-border/60 p-6 transition-all hover:shadow-elegant hover:-translate-y-0.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
                  <f.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="border-y border-border bg-secondary/30 py-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            {[
              { v: "12k+", l: "Students using ScholarSync" },
              { v: "320+", l: "University courses" },
              { v: "92%", l: "Projects submitted on time" },
              { v: "4.9/5", l: "Average rating" },
            ].map((s) => (
              <div key={s.l} className="text-center">
                <div className="text-5xl font-bold text-gradient">{s.v}</div>
                <div className="mt-2 text-sm text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-bold md:text-5xl">Loved by students & professors</h2>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {[
              { name: "Aisha K.", role: "CS Student, MIT", quote: "ScholarSync turned a 6-person chaos into a clean Kanban board. We submitted two days early." },
              { name: "Prof. Daniel M.", role: "Stanford CS-498", quote: "The AI evaluation reports save me hours per group. Contribution tracking is finally fair." },
              { name: "Marco R.", role: "Engineering Student", quote: "I love the AI timeline. It tells us exactly when things are slipping before they actually slip." },
            ].map((t) => (
              <Card key={t.name} className="p-6">
                <Quote className="h-6 w-6 text-primary" />
                <p className="mt-3 text-sm leading-relaxed">{t.quote}</p>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-warning text-warning" />)}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="rounded-3xl bg-gradient-primary p-12 text-center shadow-elegant md:p-20">
            <h2 className="text-4xl font-bold text-primary-foreground md:text-5xl">Ready to ship better group projects?</h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">Join thousands of university teams collaborating smarter with ScholarSync.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/signup"><Button size="lg" variant="secondary">Create free account</Button></Link>
              <Link to="/login"><Button size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">Log in</Button></Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 md:flex-row lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-primary">
              <GraduationCap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold">ScholarSync</span>
          </div>
          <div className="text-xs text-muted-foreground">© 2026 ScholarSync. Built for universities.</div>
        </div>
      </footer>
    </div>
  );
}
