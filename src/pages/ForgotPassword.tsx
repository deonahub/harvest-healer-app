import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
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
          <h1 className="text-2xl font-bold tracking-tight">{t("auth.resetTitle")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("auth.resetDesc")}</p>
        </div>

        {sent ? (
          <div className="bg-success/10 border border-success/30 rounded-xl p-6 text-center">
            <p className="font-semibold mb-2">{t("auth.checkEmail")}</p>
            <p className="text-sm text-muted-foreground">{t("auth.resetSent")} <strong>{email}</strong></p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("auth.email")}</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="farmer@example.com" />
            </div>
            <Button variant="hero" className="w-full h-12 rounded-xl mt-2" disabled={loading}>
              {loading ? <Loader2 className="size-5 animate-spin" /> : t("auth.sendResetLink")}
            </Button>
          </form>
        )}

        <div className="text-center mt-6">
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
            <ArrowLeft className="size-4" /> {t("auth.backToLogin")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
