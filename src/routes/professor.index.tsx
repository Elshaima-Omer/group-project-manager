import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { mockProfessorProjects } from "@/lib/mock-data";
import { Users, Crown, FileText, AlertTriangle, CheckCircle2, BookOpen } from "lucide-react";

export const Route = createFileRoute("/professor/")({
  head: () => ({ meta: [{ title: "Professor Dashboard — ScholarSync" }] }),
  component: ProfessorDashboard,
});

function ProfessorDashboard() {
  const totalStudents = new Set(mockProfessorProjects.flatMap((p) => p.members.map((m) => m.id))).size;
  const onTime = mockProfessorProjects.filter((p) => p.status !== "Delayed").length;

  return (
    <AppShell role="professor">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Professor Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Overview of your supervised student projects.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat icon={BookOpen} label="Active Projects" value={mockProfessorProjects.length} />
        <Stat icon={Users} label="Students" value={totalStudents} />
        <Stat icon={CheckCircle2} label="On Track" value={`${onTime}/${mockProfessorProjects.length}`} />
        <Stat icon={AlertTriangle} label="Delayed" value={mockProfessorProjects.filter((p) => p.status === "Delayed").length} />
      </div>

      <Card className="mt-6 p-6">
        <h2 className="mb-4 font-display text-lg font-semibold">All Groups</h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Leader</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Deadlines</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockProfessorProjects.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="font-medium">{p.title}</div>
                    <div className="text-xs text-muted-foreground">{p.id} · {p.course}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Crown className="h-3 w-3 text-warning-foreground" /> {p.leader}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex -space-x-2">
                      {p.members.slice(0, 4).map((m) => (
                        <Avatar key={m.id} className="h-7 w-7 border-2 border-background">
                          <AvatarImage src={m.avatar} />
                          <AvatarFallback>{m.name[0]}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="w-40">
                    <div className="flex items-center gap-2">
                      <Progress value={p.progress} className="h-1.5 flex-1" />
                      <span className="text-xs font-medium">{p.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <span className="text-success">{p.deadlinesMet} met</span> · <span className="text-destructive">{p.deadlinesMissed} missed</span>
                    </div>
                  </TableCell>
                  <TableCell><StatusBadge status={p.status} /></TableCell>
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
      </Card>

      {/* Per-student contribution overview */}
      <Card className="mt-6 p-6">
        <h2 className="mb-4 font-display text-lg font-semibold">Student Contributions</h2>
        <div className="space-y-3">
          {mockProfessorProjects.flatMap((p) =>
            p.members.map((m) => ({ ...m, project: p.title })),
          ).slice(0, 8).map((m, i) => (
            <div key={i} className="flex flex-wrap items-center gap-4 rounded-lg border border-border/60 p-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={m.avatar} />
                <AvatarFallback>{m.name[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  {m.name}
                  {m.role === "Leader" && <Badge variant="secondary" className="gap-1 text-[10px]"><Crown className="h-2.5 w-2.5" /> Leader</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">{m.project}</div>
              </div>
              <div className="w-40">
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Contribution</span><span className="font-medium">{m.contribution}%</span></div>
                <Progress value={m.contribution * 3} className="mt-1 h-1.5" />
              </div>
            </div>
          ))}
        </div>
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
