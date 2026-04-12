import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Leaf } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    } else {
      navigate("/");
    }
  };

  const inputClass =
    "w-full h-12 rounded-lg border border-border bg-background px-4 text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="size-3 rounded-full bg-accent shadow-[0_0_12px_hsl(var(--accent)/0.6)]" />
            <span className="font-bold text-xl tracking-tight">CropGuard AI</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="farmer@example.com" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="••••••••" />
          </div>
          <Link to="/forgot-password" className="text-sm text-muted-foreground hover:text-foreground transition-colors self-end -mt-1">
            Forgot password?
          </Link>
          <Button variant="hero" className="w-full h-12 rounded-xl mt-2" disabled={loading}>
            {loading ? <Loader2 className="size-5 animate-spin" /> : "Sign In"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don't have an account?{" "}
          <Link to="/signup" className="font-semibold text-foreground hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
