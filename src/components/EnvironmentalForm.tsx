import { useState } from "react";
import { Leaf, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { simulateEnvironmentalAnalysis, type AnalysisResult } from "@/lib/analysis";
import { addHistory } from "@/lib/history";
import ResultCard from "./ResultCard";

const EnvironmentalForm = () => {
  const [form, setForm] = useState({
    cropType: "",
    rainfall: "",
    windExposure: "",
    soilCondition: "",
    fieldSize: "",
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const update = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    setResult(null);
  };

  const canSubmit = Object.values(form).every((v) => v.trim() !== "");

  const analyze = async () => {
    setIsAnalyzing(true);
    await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000));
    const analysisResult = simulateEnvironmentalAnalysis(form);
    setResult(analysisResult);
    addHistory({ source: "environment", environmentData: form, result: analysisResult });
    setIsAnalyzing(false);
  };

  const selectClass =
    "w-full h-12 rounded-lg border border-border bg-background px-4 text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-ring appearance-none";

  return (
    <section id="environment" className="bg-muted/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">Environmental Risk Assessment</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Enter your field conditions to get a damage risk prediction and preventive recommendations.
          </p>
        </div>

        <div className="max-w-2xl mx-auto bg-card rounded-2xl p-6 sm:p-8 border border-border shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Crop Type</label>
              <select value={form.cropType} onChange={(e) => update("cropType", e.target.value)} className={selectClass}>
                <option value="">Select crop</option>
                <option value="wheat">Wheat</option>
                <option value="rice">Rice</option>
                <option value="corn">Corn</option>
                <option value="sugarcane">Sugarcane</option>
                <option value="cotton">Cotton</option>
                <option value="vegetables">Vegetables</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Rainfall Level</label>
              <select value={form.rainfall} onChange={(e) => update("rainfall", e.target.value)} className={selectClass}>
                <option value="">Select level</option>
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="heavy">Heavy</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Wind Exposure</label>
              <select value={form.windExposure} onChange={(e) => update("windExposure", e.target.value)} className={selectClass}>
                <option value="">Select level</option>
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Soil Condition</label>
              <select value={form.soilCondition} onChange={(e) => update("soilCondition", e.target.value)} className={selectClass}>
                <option value="">Select condition</option>
                <option value="good">Good</option>
                <option value="average">Average</option>
                <option value="poor">Poor</option>
              </select>
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Field Size (acres)</label>
              <input
                type="number"
                placeholder="e.g. 5"
                value={form.fieldSize}
                onChange={(e) => update("fieldSize", e.target.value)}
                className="w-full h-12 rounded-lg border border-border bg-background px-4 text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <Button variant="hero" size="lg" className="w-full h-14 rounded-xl mt-6" onClick={analyze} disabled={!canSubmit || isAnalyzing}>
            {isAnalyzing ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Leaf className="size-5" />
                Predict Risk
              </>
            )}
          </Button>
        </div>

        {result && (
          <div className="max-w-2xl mx-auto mt-8 animate-slide-up">
            <ResultCard result={result} />
          </div>
        )}
      </div>
    </section>
  );
};

export default EnvironmentalForm;
