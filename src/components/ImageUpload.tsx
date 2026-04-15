import { useState, useCallback, useRef } from "react";
import { Upload, Image, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type AnalysisResult } from "@/lib/analysis";
import { addHistory } from "@/lib/history";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import ResultCard from "./ResultCard";

interface ImageUploadProps {
  onResultText?: (text: string) => void;
}

const ImageUpload = ({ onResultText }: ImageUploadProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  const analyzeImage = useCallback(async (base64: string, name: string) => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-crop", {
        body: { imageBase64: base64 },
      });

      if (error) throw new Error(error.message || "Analysis failed");
      if (data?.error) throw new Error(data.error);

      const analysisResult = data as AnalysisResult;
      setResult(analysisResult);
      const summaryText = `${analysisResult.damageType}: ${analysisResult.description}. ${analysisResult.recommendations.join(". ")}`;
      onResultText?.(summaryText);
      await addHistory({ source: "image", fileName: name, result: analysisResult });

      toast({
        title: t("upload.complete"),
        description: analysisResult.damageType === "safe" ? t("upload.healthyCrops") : analysisResult.description,
      });
    } catch (err: any) {
      console.error("Analysis error:", err);
      toast({
        title: t("upload.failed"),
        description: err.message || "Could not analyze image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [t]);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: t("upload.invalidFile"), description: t("upload.invalidFileDesc"), variant: "destructive" });
      return;
    }
    setFileName(file.name);
    setResult(null);
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <section id="upload" className="max-w-7xl mx-auto px-4 sm:px-8 py-16">
      <div className="text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">{t("upload.heading")}</h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">{t("upload.subheading")}</p>
      </div>

      <div className="max-w-2xl mx-auto">
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
              <div className="relative rounded-xl overflow-hidden aspect-video bg-muted">
                <img src={preview} alt="Uploaded crop" className="w-full h-full object-cover" />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-background/60 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="size-10 animate-spin text-primary" />
                    <p className="text-lg font-semibold">{t("upload.analyzing")}</p>
                  </div>
                )}
                {!isAnalyzing && (
                  <button onClick={clear} className="absolute top-3 right-3 size-8 rounded-full bg-foreground/70 flex items-center justify-center hover:bg-foreground/90 transition-colors">
                    <X className="size-4 text-background" />
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Image className="size-4" />
                  <span className="truncate max-w-[200px]">{fileName}</span>
                </div>
                {!isAnalyzing && result && (
                  <Button variant="hero" size="lg" className="h-14 px-10 rounded-xl" onClick={() => analyzeImage(preview, fileName)}>
                    {t("upload.reAnalyze")}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

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
