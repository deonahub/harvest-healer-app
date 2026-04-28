import { Link } from "react-router-dom";
import { Clock, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import LanguageSelector from "@/components/LanguageSelector";

const Navbar = () => {
  const { user, loading, signOut } = useAuth();
  const { t } = useLanguage();

  return (
    <header className="w-full border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-3 rounded-full bg-accent shadow-[0_0_12px_hsl(var(--accent)/0.6)]" />
          <span className="font-bold text-xl tracking-tight">CropGuard AI</span>
        </Link>
        <nav className="flex items-center gap-3 sm:gap-5 text-sm font-medium text-muted-foreground">
          <a href="/#upload" className="hover:text-foreground transition-colors hidden sm:block">{t("nav.upload")}</a>
          <a href="/#environment" className="hover:text-foreground transition-colors hidden sm:block">{t("nav.environment")}</a>
          <Link to="/history" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
            <Clock className="size-4" />
            <span className="hidden sm:inline">{t("nav.history")}</span>
          </Link>
          <LanguageSelector />
          {!loading && (
            user ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:block text-xs text-muted-foreground truncate max-w-[120px]">{user.email}</span>
                <button onClick={signOut} className="size-9 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors" title={t("nav.signOut")}>
                  <LogOut className="size-4" />
                </button>
              </div>
            ) : (
              <Link to="/login">
                <Button size="sm" className="rounded-lg h-9">{t("nav.signIn")}</Button>
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
