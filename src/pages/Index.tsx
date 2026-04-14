import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import ImageUpload from "@/components/ImageUpload";
import EnvironmentalForm from "@/components/EnvironmentalForm";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <ImageUpload />
      <EnvironmentalForm />
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>{t("footer.text")}</p>
      </footer>
    </div>
  );
};

export default Index;
