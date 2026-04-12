import { supabase } from "@/integrations/supabase/client";
import { type AnalysisResult } from "./analysis";

export interface HistoryEntry {
  id: string;
  timestamp: number;
  source: "image" | "environment";
  fileName?: string;
  environmentData?: Record<string, string>;
  result: AnalysisResult;
}

export async function getHistory(): Promise<HistoryEntry[]> {
  const { data, error } = await supabase
    .from("scan_history")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];

  return data.map((row: any) => ({
    id: row.id,
    timestamp: new Date(row.created_at).getTime(),
    source: row.source as "image" | "environment",
    fileName: row.file_name ?? undefined,
    environmentData: row.environment_data ?? undefined,
    result: {
      damageType: row.damage_type,
      severity: row.severity,
      confidence: Number(row.confidence),
      areaAffected: Number(row.area_affected),
      description: row.description,
      recommendations: row.recommendations,
    } as AnalysisResult,
  }));
}

export async function addHistory(entry: {
  source: "image" | "environment";
  fileName?: string;
  thumbnail?: string; // no longer stored
  environmentData?: Record<string, string>;
  result: AnalysisResult;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return; // Only save for logged-in users

  await supabase.from("scan_history").insert({
    user_id: user.id,
    source: entry.source,
    file_name: entry.fileName ?? null,
    environment_data: entry.environmentData ?? null,
    damage_type: entry.result.damageType,
    severity: entry.result.severity,
    confidence: entry.result.confidence,
    area_affected: entry.result.areaAffected,
    description: entry.result.description,
    recommendations: entry.result.recommendations,
  });
}

export async function clearHistory(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("scan_history").delete().eq("user_id", user.id);
}
