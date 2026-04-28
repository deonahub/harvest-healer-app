import { useState, useCallback, useRef, useEffect } from "react";
import { Upload, Image as ImageIcon, X, Loader2, Eye, Sparkles, Activity, Flame, Square, ScanSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type AnalysisResult } from "@/lib/analysis";
import { addHistory } from "@/lib/history";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { runPipeline, buildDamageView, type ProcessedPipeline } from "@/lib/imageProcessing";
import ResultCard from "./ResultCard";

interface ImageUploadProps {
  onResultText?: (text: string) => void;
}

type ViewMode = "original" | "enhanced" | "edges" | "damage" | "heatmap";

const ImageUpload = ({ onResultText }: ImageUploadProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pipelineStep, setPipelineStep] = useState<string>("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [pipeline, setPipeline] = useState<ProcessedPipeline | null>(null);
  const [damageDataUrl, setDamageDataUrl] = useState<string | null>(null);
  const [computedDamagePct, setComputedDamagePct] = useState<number | null>(null);
  const [boxCount, setBoxCount] = useState<number>(0);
  const [viewMode, setViewMode] = useState<ViewMode>("original");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  const analyzeImage = useCallback(async (base64: string, name: string) => {
    setIsAnalyzing(true);
    setResult(null);
    setPipeline(null);
    setDamageDataUrl(null);
    setComputedDamagePct(null);
    setBoxCount(0);
    setViewMode("original");

    try {
      // === Image Processing Pipeline ===
      setPipelineStep(t("pipeline.resize"));
      await new Promise((r) => setTimeout(r, 50));
      setPipelineStep(t("pipeline.gray"));
      await new Promise((r) => setTimeout(r, 50));
      setPipelineStep(t("pipeline.denoise"));
      await new Promise((r) => setTimeout(r, 50));
      setPipelineStep(t("pipeline.blurCheck"));
      const pipe = await runPipeline(base64);
      setPipeline(pipe);
      if (pipe.isBlurry) {
        toast({ title: t("pipeline.blurry"), description: t("pipeline.blurryDesc") });
      }
      setPipelineStep(t("pipeline.enhance"));
      await new Promise((r) => setTimeout(r, 50));
      setPipelineStep(t("pipeline.edges"));
      await new Promise((r) => setTimeout(r, 50));

      // === AI Analysis on enhanced image ===
      setPipelineStep(t("pipeline.aiAnalyzing"));
      const { data, error } = await supabase.functions.invoke("analyze-crop", {
        body: { imageBase64: pipe.enhanced },
      });
      if (error) throw new Error(error.message || "Analysis failed");
      if (data?.error) throw new Error(data.error);

      const analysisResult = data as AnalysisResult;

      // === Damage overlay & bounding boxes ===
      setPipelineStep(t("pipeline.damage"));
      const dmg = await buildDamageView(pipe.original, analysisResult.damageType);
      setDamageDataUrl(dmg.dataUrl);
      setComputedDamagePct(dmg.damagePercent);
      setBoxCount(dmg.boxCount);

      // Merge computed damage into result for display consistency
      const mergedResult: AnalysisResult = {
        ...analysisResult,
        areaAffected:
          analysisResult.damageType === "safe"
            ? 0
            : Math.max(analysisResult.areaAffected, dmg.damagePercent),
      };
      setResult(mergedResult);

      const summaryText = `${mergedResult.damageType}: ${mergedResult.description}. ${mergedResult.recommendations.join(". ")}`;
      onResultText?.(summaryText);
      await addHistory({ source: "image", fileName: name, result: mergedResult });

      toast({
        title: t("upload.complete"),
        description: mergedResult.damageType === "safe" ? t("upload.healthyCrops") : mergedResult.description,
      });

      // Auto-switch to damage view if damage found
      setViewMode(mergedResult.damageType === "safe" ? "enhanced" : "damage");
    } catch (err: any) {
      console.error("Analysis error:", err);
      toast({
        title: t("upload.failed"),
        description: err.message || "Could not analyze image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      setPipelineStep("");
    }
  }, [t, onResultText]);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: t("upload.invalidFile"), description: t("upload.invalidFileDesc"), variant: "destructive" });
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setPreview(base64);
      analyzeImage(base64, file.name);
    };
    reader.readAsDataURL(file);
  }, [analyzeImage, t]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const openFilePicker = () => fileInputRef.current?.click();

  const clear = () => {
    setPreview(null);
    setFileName("");
    setResult(null);
    setPipeline(null);
    setDamageDataUrl(null);
    setComputedDamagePct(null);
    setBoxCount(0);
    setViewMode("original");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Decide which image to display based on current mode
  const displayedImage = (() => {
    if (!pipeline) return preview;
    switch (viewMode) {
      case "enhanced": return pipeline.enhanced;
      case "edges": return pipeline.edges;
      case "damage": return damageDataUrl || pipeline.original;
      case "heatmap": return pipeline.heatmap;
      default: return pipeline.original;
    }
  })();

  const viewModes: { id: ViewMode; label: string; icon: typeof Eye }[] = [
    { id: "original", label: t("view.original"), icon: Eye },
    { id: "enhanced", label: t("view.enhanced"), icon: Sparkles },
    { id: "edges", label: t("view.edges"), icon: Activity },
    { id: "damage", label: t("view.damage"), icon: Square },
    { id: "heatmap", label: t("view.heatmap"), icon: Flame },
  ];

  return (
    <section id="upload" className="max-w-7xl mx-auto px-4 sm:px-8 py-16">
      <div className="text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">{t("upload.heading")}</h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">{t("upload.subheading")}</p>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="bg-card rounded-2xl p-3 border border-border shadow-sm">
          {!preview ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={openFilePicker}
              className="border-2 border-dashed border-border rounded-xl p-10 sm:p-16 flex flex-col items-center gap-6 cursor-pointer hover:bg-muted/50 transition-colors min-h-[320px] justify-center"
            >
              <div className="size-20 rounded-full bg-muted flex items-center justify-center">
                <Upload className="size-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-xl font-semibold mb-1">{t("upload.dropzone")}</p>
                <p className="text-muted-foreground text-sm">{t("upload.formats")}</p>
              </div>
              <Button variant="hero" size="lg" className="w-full max-w-xs h-14 rounded-xl" type="button" onClick={(e) => { e.stopPropagation(); openFilePicker(); }}>
                {t("upload.selectBtn")}
              </Button>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/jpg" onChange={handleChange} className="hidden" />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="relative rounded-xl overflow-hidden bg-muted">
                <img
                  src={displayedImage || preview}
                  alt={`Crop view: ${viewMode}`}
                  className="w-full h-auto block"
                />
                {/* Damage % badge on damage view */}
                {!isAnalyzing && viewMode === "damage" && computedDamagePct !== null && (
                  <div className="absolute top-3 left-3 bg-destructive text-destructive-foreground px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg">
                    {t("result.areaAffected")}: {result?.areaAffected ?? computedDamagePct}%
                  </div>
                )}
                {/* Quality badge */}
                {!isAnalyzing && pipeline && (
                  <div className={`absolute top-3 right-12 px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg ${pipeline.isBlurry ? "bg-warning text-warning-foreground" : "bg-success text-success-foreground"}`}>
                    {pipeline.isBlurry ? t("quality.blurry") : t("quality.clear")}
                  </div>
                )}
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-background/70 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="size-10 animate-spin text-primary" />
                    <p className="text-lg font-semibold">{t("upload.analyzing")}</p>
                    {pipelineStep && (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <ScanSearch className="size-4" />
                        {pipelineStep}
                      </p>
                    )}
                  </div>
                )}
                {!isAnalyzing && (
                  <button onClick={clear} className="absolute top-3 right-3 size-8 rounded-full bg-foreground/70 flex items-center justify-center hover:bg-foreground/90 transition-colors">
                    <X className="size-4 text-background" />
                  </button>
                )}
              </div>

              {/* View mode toggles */}
              {pipeline && !isAnalyzing && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 px-1">
                  {viewModes.map((m) => {
                    const Icon = m.icon;
                    const active = viewMode === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setViewMode(m.id)}
                        className={`flex flex-col items-center gap-1 py-3 rounded-xl border transition-colors ${
                          active
                            ? "bg-primary text-primary-foreground border-primary shadow"
                            : "bg-muted/40 border-border hover:bg-muted text-foreground"
                        }`}
                      >
                        <Icon className="size-5" />
                        <span className="text-xs font-medium">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ImageIcon className="size-4" />
                  <span className="truncate max-w-[200px]">{fileName}</span>
                </div>
                {!isAnalyzing && result && (
                  <Button variant="hero" size="lg" className="h-12 px-6 rounded-xl" onClick={() => analyzeImage(preview!, fileName)}>
                    {t("upload.reAnalyze")}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pipeline diagnostics */}
        {pipeline && !isAnalyzing && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="bg-card border border-border rounded-xl p-3">
              <div className="text-xs text-muted-foreground">{t("diag.quality")}</div>
              <div className={`font-bold ${pipeline.isBlurry ? "text-warning" : "text-success"}`}>
                {pipeline.isBlurry ? t("quality.blurry") : t("quality.clear")}
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-3">
              <div className="text-xs text-muted-foreground">{t("diag.blurScore")}</div>
              <div className="font-bold">{pipeline.blurScore}</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-3">
              <div className="text-xs text-muted-foreground">{t("diag.regions")}</div>
              <div className="font-bold">{boxCount}</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-3">
              <div className="text-xs text-muted-foreground">{t("diag.damagePct")}</div>
              <div className="font-bold">{result?.areaAffected ?? computedDamagePct ?? 0}%</div>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-8 animate-slide-up">
            <ResultCard result={result} />
          </div>
        )}
      </div>
    </section>
  );
};

export default ImageUpload;
