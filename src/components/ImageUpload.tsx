import { useState, useCallback } from "react";
import { Upload, Image, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { simulateImageAnalysis, type AnalysisResult } from "@/lib/analysis";
import ResultCard from "./ResultCard";

const ImageUpload = () => {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const analyze = async () => {
    setIsAnalyzing(true);
    await new Promise((r) => setTimeout(r, 2000 + Math.random() * 1000));
    setResult(simulateImageAnalysis());
    setIsAnalyzing(false);
  };

  const clear = () => {
    setPreview(null);
    setFileName("");
    setResult(null);
  };

  return (
    <section id="upload" className="max-w-7xl mx-auto px-4 sm:px-8 py-16">
      <div className="text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">Image Analysis</h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Upload a clear photo of your crop to detect damage, estimate severity, and get recovery recommendations.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-card rounded-2xl p-3 border border-border shadow-sm">
          {!preview ? (
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-border rounded-xl p-10 sm:p-16 flex flex-col items-center gap-6 cursor-pointer hover:bg-muted/50 transition-colors min-h-[320px] justify-center"
            >
              <div className="size-20 rounded-full bg-muted flex items-center justify-center">
                <Upload className="size-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-xl font-semibold mb-1">Upload Crop Image</p>
                <p className="text-muted-foreground text-sm">JPG, PNG, JPEG — drag & drop or tap to select</p>
              </div>
              <Button variant="hero" size="lg" className="w-full max-w-xs h-14 rounded-xl" type="button">
                Select Photo
              </Button>
              <input type="file" accept="image/*" onChange={handleChange} className="hidden" />
            </label>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="relative rounded-xl overflow-hidden aspect-video bg-muted">
                <img src={preview} alt="Uploaded crop" className="w-full h-full object-cover" />
                <button onClick={clear} className="absolute top-3 right-3 size-8 rounded-full bg-foreground/70 flex items-center justify-center hover:bg-foreground/90 transition-colors">
                  <X className="size-4 text-background" />
                </button>
              </div>
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Image className="size-4" />
                  <span className="truncate max-w-[200px]">{fileName}</span>
                </div>
                <Button variant="hero" size="lg" className="h-14 px-10 rounded-xl" onClick={analyze} disabled={isAnalyzing}>
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Analyze Image"
                  )}
                </Button>
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
