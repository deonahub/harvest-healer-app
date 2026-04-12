import { Camera, BarChart3, Lightbulb, Shield } from "lucide-react";

const features = [
  {
    icon: Camera,
    title: "Image Detection",
    description: "Upload photos for instant AI-powered crop damage analysis",
  },
  {
    icon: BarChart3,
    title: "Severity Estimation",
    description: "Get accurate damage severity levels from low to high",
  },
  {
    icon: Lightbulb,
    title: "Smart Recommendations",
    description: "Receive tailored recovery plans based on damage type",
  },
  {
    icon: Shield,
    title: "Risk Assessment",
    description: "Enter environmental data for predictive damage analysis",
  },
];

const FeaturesSection = () => (
  <section id="features" className="max-w-7xl mx-auto px-4 sm:px-8 py-16">
    <div className="text-center mb-12">
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">How It Works</h2>
      <p className="text-muted-foreground text-lg">Simple, powerful tools designed for farmers</p>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {features.map((f) => (
        <div key={f.title} className="bg-card rounded-2xl p-6 border border-border hover:border-accent/40 hover:shadow-md transition-all group">
          <div className="size-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
            <f.icon className="size-6 text-accent-foreground" />
          </div>
          <h3 className="font-bold text-lg mb-2">{f.title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
        </div>
      ))}
    </div>
  </section>
);

export default FeaturesSection;
