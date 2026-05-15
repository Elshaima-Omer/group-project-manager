import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, ArrowLeft, BookOpen, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — ScholarSync" }, { name: "description", content: "Create your free ScholarSync account as a student or professor." }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<"Student" | "Professor">("Student");
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Step 1: Create auth account in Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      console.log("Supabase response:", data, error);

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      const userId = data.user?.id;

      if (!userId) {
        toast.error("Signup failed. Please try again.");
        setLoading(false);
        return;
      }

      // Step 2: Save extra info to profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          full_name: name,
          email: email,
          role: role.toLowerCase(),
        });

      if (profileError) {
        toast.error("Account created but profile save failed: " + profileError.message);
        setLoading(false);
        return;
      }

      toast.success(`Account created — welcome, ${name}!`);
      navigate({ to: role === "Professor" ? "/professor" : "/dashboard" });

    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden bg-gradient-hero lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold">ScholarSync</span>
        </Link>

        <div>
          <h2 className="font-display text-4xl font-bold leading-tight">
            Join the future of<br />university teamwork.
          </h2>
          <p className="mt-4 max-w-md text-muted-foreground">
            Sign up free as a student or professor. AI handles the planning so your team can focus on the work.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { v: "12k+", l: "Students" },
              { v: "320+", l: "Courses" },
              { v: "92%", l: "On-time" },
              { v: "4.9★", l: "Rating" },
            ].map((s) => (
              <div key={s.l} className="glass rounded-xl p-4">
                <div className="font-display text-2xl font-bold text-gradient">{s.v}</div>
                <div className="text-xs text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">© 2026 ScholarSync · Built for universities</div>
      </div>

      <div className="flex flex-col p-6 lg:p-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
          <h1 className="font-display text-3xl font-bold">Create account</h1>
          <p className="mt-2 text-sm text-muted-foreground">Free for students and professors.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label>I am a</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["Student", "Professor"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-lg border-2 p-3 text-left text-sm transition-all",
                      role === r ? "border-primary bg-accent/50" : "border-border hover:border-border/80"
                    )}
                  >
                    {r === "Student" ? <BookOpen className="h-4 w-4 text-primary" /> : <Users className="h-4 w-4 text-primary" />}
                    <span className="font-medium">{r}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                placeholder="Aisha Khan"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@uni.edu"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-gradient-primary shadow-elegant">
              {loading ? "Creating account..." : `Create ${role.toLowerCase()} account`}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}