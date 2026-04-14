import { Camera, BarChart3, Lightbulb, Shield } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const FeaturesSection = () => {
  const { t } = useLanguage();

  const features = [
    { icon: Camera, titleKey: "features.imageDetection", descKey: "features.imageDetectionDesc" },
    { icon: BarChart3, titleKey: "features.severityEstimation", descKey: "features.severityEstimationDesc" },
    { icon: Lightbulb, titleKey: "features.smartRecommendations", descKey: "features.smartRecommendationsDesc" },
    { icon: Shield, titleKey: "features.riskAssessment", descKey: "features.riskAssessmentDesc" },
  ];

  return (
    <section id="features" className="max-w-7xl mx-auto px-4 sm:px-8 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">{t("features.heading")}</h2>
        <p className="text-muted-foreground text-lg">{t("features.subheading")}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f) => (
          <div key={f.titleKey} className="bg-card rounded-2xl p-6 border border-border hover:border-accent/40 hover:shadow-md transition-all group">
            <div className="size-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
              <f.icon className="size-6 text-accent-foreground" />
            </div>
            <h3 className="font-bold text-lg mb-2">{t(f.titleKey)}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{t(f.descKey)}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;
