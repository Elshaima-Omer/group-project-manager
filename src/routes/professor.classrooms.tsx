import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { generateJoinCode } from "@/lib/classrooms";
import { BookOpen, Copy, Check, Plus, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/professor/classrooms")({
  head: () => ({ meta: [{ title: "Classrooms — ScholarSync" }] }),
  component: ProfessorClassrooms,
});

function ProfessorClassrooms() {
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [term, setTerm] = useState("");
  const [description, setDescription] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    loadClassrooms();
  }, []);

  const loadClassrooms = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("classrooms")
      .select("*")
      .eq("professor_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Could not load classrooms: " + error.message);
    } else {
      setClassrooms(data || []);
    }
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a classroom name (e.g. CS-498 Capstone).");
      return;
    }

    setCreating(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in.");
      setCreating(false);
      return;
    }

    let joinCode = generateJoinCode();
    let attempts = 0;

    while (attempts < 5) {
      const { data, error } = await supabase
        .from("classrooms")
        .insert({
          professor_id: user.id,
          name: name.trim(),
          term: term.trim() || null,
          description: description.trim() || null,
          join_code: joinCode,
        })
        .select()
        .single();

      if (!error && data) {
        toast.success("Classroom created! Share the code with your students.");
        setName("");
        setTerm("");
        setDescription("");
        setShowForm(false);
        await loadClassrooms();
        setCreating(false);
        return;
      }

      if (error?.message?.includes("join_code") || error?.code === "23505") {
        joinCode = generateJoinCode();
        attempts++;
        continue;
      }

      toast.error("Failed to create classroom: " + (error?.message ?? "Unknown error"));
      setCreating(false);
      return;
    }

    toast.error("Could not generate a unique code. Please try again.");
    setCreating(false);
  };

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Classroom code copied!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <AppShell role="professor">
      <Link
        to="/professor"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">My Classrooms</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a classroom for each course. Students enter your classroom code when they create a
            project.
          </p>
        </div>
        <Button
          className="bg-gradient-primary shadow-elegant"
          onClick={() => setShowForm((v) => !v)}
        >
          <Plus className="mr-2 h-4 w-4" />
          {showForm ? "Cancel" : "New classroom"}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8 p-6">
          <h2 className="font-display text-lg font-semibold">Create classroom</h2>
          <form onSubmit={handleCreate} className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cname">Classroom name *</Label>
              <Input
                id="cname"
                placeholder="CS-498 Capstone"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">Example: CS-498 Capstone</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cterm">Term (optional)</Label>
              <Input
                id="cterm"
                placeholder="Fall 2026"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cdesc">Description (optional)</Label>
              <Textarea
                id="cdesc"
                rows={2}
                placeholder="Brief notes for yourself"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={creating} className="bg-gradient-primary">
              {creating ? "Creating..." : "Create classroom"}
            </Button>
          </form>
        </Card>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading classrooms...</p>
      ) : classrooms.length === 0 ? (
        <Card className="p-8 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 font-medium">No classrooms yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Click &quot;New classroom&quot; above. You will get a code to give students.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {classrooms.map((c) => (
            <Card key={c.id} className="p-6">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-lg font-semibold">{c.name}</h3>
                  {c.term && <p className="text-sm text-muted-foreground">{c.term}</p>}
                </div>
                <Badge variant={c.is_active ? "secondary" : "outline"}>
                  {c.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              {c.description && (
                <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
              )}
              <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Student classroom code
                </p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="font-mono text-2xl font-bold tracking-widest">{c.join_code}</span>
                  <Button type="button" variant="outline" size="sm" onClick={() => copyCode(c.join_code)}>
                    {copiedCode === c.join_code ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Students enter this code when creating a project. Only projects linked to this code
                  appear on your dashboard.
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
