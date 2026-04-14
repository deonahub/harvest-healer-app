import heroImage from "@/assets/hero-field.jpg";
import { useLanguage } from "@/contexts/LanguageContext";

const HeroSection = () => {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-[70vh] flex items-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-foreground/60 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent z-10" />
        <img src={heroImage} alt="Agricultural field" className="w-full h-full object-cover" width={1920} height={1080} />
      </div>
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-8 py-20 w-full">
        <div className="flex flex-col gap-6 max-w-2xl">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-accent/30 bg-accent/10 backdrop-blur-md w-fit">
            <div className="size-2 rounded-full bg-accent animate-pulse-glow" />
            <span className="text-sm font-semibold text-accent uppercase tracking-wider">{t("hero.badge")}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-primary-foreground leading-[1.1]">
            {t("hero.title1")} <span className="text-accent">{t("hero.title2")}</span>
          </h1>
          <p className="text-lg text-primary-foreground/80 max-w-lg leading-relaxed">
            {t("hero.subtitle")}
          </p>
          <div className="flex gap-4 mt-2">
            <a href="#upload" className="inline-flex items-center justify-center h-14 px-8 rounded-xl bg-accent text-accent-foreground font-bold text-lg hover:bg-accent/80 shadow-lg transition-all active:scale-[0.98]">
              {t("hero.uploadBtn")}
            </a>
            <a href="#environment" className="inline-flex items-center justify-center h-14 px-8 rounded-xl bg-primary-foreground/10 text-primary-foreground font-semibold border border-primary-foreground/20 hover:bg-primary-foreground/20 backdrop-blur-sm transition-all">
              {t("hero.dataBtn")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
