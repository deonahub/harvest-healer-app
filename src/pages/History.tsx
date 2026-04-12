import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Trash2, Clock, Camera, Leaf, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getHistory, clearHistory, type HistoryEntry } from "@/lib/history";
import ResultCard from "@/components/ResultCard";
import { damageLabels, severityColors } from "@/lib/analysis";
import Navbar from "@/components/Navbar";

const HistoryPage = () => {
  const [entries, setEntries] = useState<HistoryEntry[]>(getHistory());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleClear = () => {
    clearHistory();
    setEntries([]);
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link to="/" className="size-10 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
              <ArrowLeft className="size-5" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Scan History</h1>
              <p className="text-sm text-muted-foreground">{entries.length} previous {entries.length === 1 ? "scan" : "scans"}</p>
            </div>
          </div>
          {entries.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClear} className="text-destructive hover:text-destructive">
              <Trash2 className="size-4" />
              Clear All
            </Button>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-12 text-center">
            <Clock className="size-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No scans yet</h3>
            <p className="text-muted-foreground mb-6">Upload a crop image or enter environmental data to start.</p>
            <Link to="/">
              <Button variant="hero" className="h-12 px-8 rounded-xl">Go to Dashboard</Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map((entry) => {
              const isExpanded = expandedId === entry.id;
              const isSafe = entry.result.damageType === "safe";
              return (
                <div key={entry.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    className="w-full px-5 py-4 flex items-center gap-4 hover:bg-muted/30 transition-colors text-left"
                  >
                    {entry.thumbnail ? (
                      <img src={entry.thumbnail} alt="" className="size-12 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="size-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        {entry.source === "image" ? <Camera className="size-5 text-muted-foreground" /> : <Leaf className="size-5 text-muted-foreground" />}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate">{damageLabels[entry.result.damageType]}</span>
                        <span className={`text-xs font-bold uppercase ${severityColors[entry.result.severity]}`}>
                          {entry.result.severity}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>{entry.source === "image" ? "Image scan" : "Environmental"}</span>
                        <span>·</span>
                        <span>{formatDate(entry.timestamp)}</span>
                      </div>
                    </div>
                    <div className="text-sm font-bold tabular-nums">{entry.result.confidence}%</div>
                    {isExpanded ? <ChevronUp className="size-4 text-muted-foreground shrink-0" /> : <ChevronDown className="size-4 text-muted-foreground shrink-0" />}
                  </button>
                  {isExpanded && (
                    <div className="px-5 pb-5 animate-slide-up">
                      <ResultCard result={entry.result} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
