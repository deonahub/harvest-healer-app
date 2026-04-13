import { useState, useCallback, useRef } from "react";
import { Upload, Image, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { simulateImageAnalysis, type AnalysisResult } from "@/lib/analysis";
import { addHistory } from "@/lib/history";
import ResultCard from "./ResultCard";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

const ImageUpload = () => {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please upload a valid image (JPG, PNG, or WebP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be under 10 MB.");
      return;
    }
    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.onerror = () => setError("Failed to read file.");
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

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const analyze = async () => {
    setIsAnalyzing(true);
    try {
      await new Promise((r) => setTimeout(r, 2000 + Math.random() * 1000));
      const analysisResult = simulateImageAnalysis();
      setResult(analysisResult);
      await addHistory({ source: "image", fileName, result: analysisResult });
    } catch {
      setError("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clear = () => {
    setPreview(null);
    setFileName("");
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
                <p className="text-xl font-semibold mb-1">Upload Crop Image</p>
                <p className="text-muted-foreground text-sm">JPG, PNG, WebP — drag & drop or tap to select</p>
              </div>
              <Button variant="hero" size="lg" className="w-full max-w-xs h-14 rounded-xl" type="button">
                Select Photo
              </Button>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleChange} className="hidden" />
            </div>
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

        {error && (
          <div className="mt-4 p-4 rounded-xl bg-destructive/10 text-destructive text-sm font-medium text-center">
            {error}
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
