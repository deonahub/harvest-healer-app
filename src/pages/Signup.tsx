import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) {
      toast({ title: t("auth.signupFailed"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("auth.accountCreated"), description: t("auth.checkEmailVerify") });
      navigate("/login");
    }
  };

  const inputClass = "w-full h-12 rounded-lg border border-border bg-background px-4 text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="size-3 rounded-full bg-accent shadow-[0_0_12px_hsl(var(--accent)/0.6)]" />
            <span className="font-bold text-xl tracking-tight">CropGuard AI</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t("auth.createAccount")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("auth.createAccountDesc")}</p>
        </div>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("auth.fullName")}</label>
            <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} placeholder="John Doe" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("auth.email")}</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="farmer@example.com" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("auth.password")}</label>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="••••••••" />
          </div>
          <Button variant="hero" className="w-full h-12 rounded-xl mt-2" disabled={loading}>
            {loading ? <Loader2 className="size-5 animate-spin" /> : t("auth.createBtn")}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {t("auth.hasAccount")}{" "}
          <Link to="/login" className="font-semibold text-foreground hover:underline">{t("auth.signInLink")}</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
