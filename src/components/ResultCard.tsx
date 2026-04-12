import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2 } from "lucide-react";
import { type AnalysisResult, damageLabels, severityColors } from "@/lib/analysis";

interface Props {
  result: AnalysisResult;
}

const severityBg: Record<string, string> = {
  low: "bg-success/10 border-success/30",
  medium: "bg-warning/10 border-warning/30",
  high: "bg-destructive/10 border-destructive/30",
};

const ResultCard = ({ result }: Props) => {
  const isSafe = result.damageType === "safe";

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className={`px-6 py-4 border-b border-border flex items-center gap-3 ${isSafe ? "bg-success/5" : "bg-destructive/5"}`}>
        {isSafe ? (
          <ShieldCheck className="size-5 text-success" />
        ) : (
          <ShieldAlert className="size-5 text-destructive" />
        )}
        <span className="font-semibold text-lg">{damageLabels[result.damageType]}</span>
      </div>

      <div className="p-6 flex flex-col gap-6">
        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center p-4 rounded-xl bg-muted/50">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Severity</span>
            <span className={`text-xl font-bold capitalize ${severityColors[result.severity]}`}>
              {result.severity}
            </span>
          </div>
          <div className="flex flex-col items-center p-4 rounded-xl bg-muted/50">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Confidence</span>
            <span className="text-xl font-bold">{result.confidence}%</span>
          </div>
          <div className="flex flex-col items-center p-4 rounded-xl bg-muted/50">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Area Affected</span>
            <span className="text-xl font-bold">{result.areaAffected}%</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-muted-foreground leading-relaxed">{result.description}</p>

        {/* Recommendations */}
        <div className={`rounded-xl p-5 border ${severityBg[result.severity]}`}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="size-4 text-warning" />
            <span className="font-semibold text-sm uppercase tracking-wider">Recovery Recommendations</span>
          </div>
          <ul className="space-y-2">
            {result.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="size-4 text-success mt-0.5 shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;
