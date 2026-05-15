import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, ArrowLeft, Sparkles, Brain, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — ScholarSync" }, { name: "description", content: "Log in to your ScholarSync account." }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Step 1: Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      const userId = data.user?.id;

      if (!userId) {
        toast.error("Login failed. Please try again.");
        setLoading(false);
        return;
      }

      // Step 2: Get the user's profile to check their role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", userId)
        .single();

      if (profileError || !profile) {
        toast.error("Could not load your profile. Please try again.");
        setLoading(false);
        return;
      }

      // Step 3: Redirect based on role
      toast.success(`Welcome back, ${profile.full_name}!`);
      if (profile.role === "professor") {
        navigate({ to: "/professor" });
      } else {
        navigate({ to: "/dashboard" });
      }

    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left visual */}
      <div className="relative hidden bg-gradient-hero lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold">ScholarSync</span>
        </Link>

        <div>
          <h2 className="font-display text-4xl font-bold leading-tight">
            Welcome back to<br />smarter group work.
          </h2>
          <p className="mt-4 max-w-md text-muted-foreground">
            Pick up exactly where you left off. Your projects, tasks, and AI insights are waiting.
          </p>

          <div className="mt-10 grid gap-4">
            {[
              { icon: Sparkles, t: "AI tasks generated for every project" },
              { icon: Brain, t: "Smart timeline with milestone alerts" },
              { icon: Users, t: "Real-time team collaboration" },
            ].map((f) => (
              <div key={f.t} className="glass flex items-center gap-3 rounded-xl p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary">
                  <f.icon className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-sm font-medium">{f.t}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-muted-foreground">© 2026 ScholarSync · Built for universities</div>
      </div>

      {/* Right form */}
      <div className="flex flex-col p-6 lg:p-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
          <h1 className="font-display text-3xl font-bold">Log in</h1>
          <p className="mt-2 text-sm text-muted-foreground">Enter your credentials to access your dashboard.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-xs text-primary hover:underline">Forgot?</a>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-gradient-primary shadow-elegant">
              {loading ? "Signing in..." : "Log in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="font-medium text-primary hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}