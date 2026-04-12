import { type AnalysisResult } from "./analysis";

export interface HistoryEntry {
  id: string;
  timestamp: number;
  source: "image" | "environment";
  fileName?: string;
  thumbnail?: string;
  environmentData?: Record<string, string>;
  result: AnalysisResult;
}

const STORAGE_KEY = "cropguard_history";

export function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addHistory(entry: Omit<HistoryEntry, "id" | "timestamp">): HistoryEntry {
  const full: HistoryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  const history = getHistory();
  history.unshift(full);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50)));
  return full;
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}
