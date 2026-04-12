import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import ImageUpload from "@/components/ImageUpload";
import EnvironmentalForm from "@/components/EnvironmentalForm";

const Index = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <HeroSection />
    <FeaturesSection />
    <ImageUpload />
    <EnvironmentalForm />
    <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
      <p>© 2026 CropGuard AI — Smart Crop Damage Detection</p>
    </footer>
  </div>
);

export default Index;
