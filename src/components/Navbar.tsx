import { Leaf } from "lucide-react";

const Navbar = () => {
  return (
    <header className="w-full border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-3 rounded-full bg-accent shadow-[0_0_12px_hsl(var(--accent)/0.6)]" />
          <span className="font-bold text-xl tracking-tight">CropGuard AI</span>
        </div>
        <nav className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <a href="#upload" className="hover:text-foreground transition-colors hidden sm:block">Upload</a>
          <a href="#environment" className="hover:text-foreground transition-colors hidden sm:block">Environment</a>
          <a href="#features" className="hover:text-foreground transition-colors hidden sm:block">Features</a>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
