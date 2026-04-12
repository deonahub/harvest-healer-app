export type DamageType = "safe" | "animal_damage" | "crop_lodging" | "combined";
export type SeverityLevel = "low" | "medium" | "high";

export interface AnalysisResult {
  damageType: DamageType;
  severity: SeverityLevel;
  confidence: number;
  areaAffected: number;
  description: string;
  recommendations: string[];
}

const damageLabels: Record<DamageType, string> = {
  safe: "No Damage Detected",
  animal_damage: "Animal Damage Detected",
  crop_lodging: "Crop Lodging Detected",
  combined: "Combined Damage Detected",
};

const severityColors: Record<SeverityLevel, string> = {
  low: "text-success",
  medium: "text-warning",
  high: "text-destructive",
};

export { damageLabels, severityColors };

const animalRecommendations = [
  "Install protective fencing around affected areas",
  "Use natural animal repellents (neem oil, garlic spray)",
  "Install motion-activated deterrent devices",
  "Re-sow damaged crop sections",
  "Set up monitoring cameras for wildlife tracking",
];

const lodgingRecommendations = [
  "Provide mechanical plant support (stakes, trellises)",
  "Improve field drainage systems",
  "Reduce irrigation frequency temporarily",
  "Consider early harvest of severely affected areas",
  "Apply growth regulators in next season",
];

const combinedRecommendations = [
  "Reinforce soil with organic matter",
  "Replant severely damaged sections",
  "Install deterrent systems for wildlife",
  "Improve drainage and soil structure",
  "Consult agricultural extension services",
];

export function simulateImageAnalysis(): AnalysisResult {
  const types: DamageType[] = ["safe", "animal_damage", "crop_lodging", "combined"];
  const damageType = types[Math.floor(Math.random() * types.length)];

  if (damageType === "safe") {
    return {
      damageType: "safe",
      severity: "low",
      confidence: 92 + Math.random() * 7,
      areaAffected: 0,
      description: "Your crops appear healthy. No signs of animal damage or lodging detected.",
      recommendations: ["Continue regular monitoring", "Maintain current crop management practices"],
    };
  }

  const severities: SeverityLevel[] = ["low", "medium", "high"];
  const severity = severities[Math.floor(Math.random() * severities.length)];
  const confidence = 80 + Math.random() * 18;
  const areaAffected = severity === "low" ? 5 + Math.random() * 15 : severity === "medium" ? 20 + Math.random() * 30 : 50 + Math.random() * 40;

  const descriptions: Record<DamageType, string> = {
    safe: "",
    animal_damage: "Signs of animal grazing detected. Likely caused by peacocks, monkeys, or grazing wildlife.",
    crop_lodging: "Crop lodging detected due to environmental factors such as wind, rain, or weak soil support.",
    combined: "Both animal damage and crop lodging detected in the field area.",
  };

  const recs = damageType === "animal_damage" ? animalRecommendations : damageType === "crop_lodging" ? lodgingRecommendations : combinedRecommendations;

  return {
    damageType,
    severity,
    confidence: Math.round(confidence * 10) / 10,
    areaAffected: Math.round(areaAffected * 10) / 10,
    description: descriptions[damageType],
    recommendations: recs.slice(0, 3 + Math.floor(Math.random() * 2)),
  };
}

export function simulateEnvironmentalAnalysis(data: {
  cropType: string;
  rainfall: string;
  windExposure: string;
  soilCondition: string;
  fieldSize: string;
}): AnalysisResult {
  let riskScore = 0;
  if (data.rainfall === "heavy") riskScore += 3;
  else if (data.rainfall === "moderate") riskScore += 1;
  if (data.windExposure === "high") riskScore += 3;
  else if (data.windExposure === "moderate") riskScore += 1;
  if (data.soilCondition === "poor") riskScore += 3;
  else if (data.soilCondition === "average") riskScore += 1;

  const severity: SeverityLevel = riskScore >= 6 ? "high" : riskScore >= 3 ? "medium" : "low";
  const damageType: DamageType = riskScore >= 6 ? "combined" : riskScore >= 3 ? "crop_lodging" : "safe";

  if (damageType === "safe") {
    return {
      damageType: "safe",
      severity: "low",
      confidence: 85 + Math.random() * 10,
      areaAffected: 0,
      description: "Environmental conditions are favorable. Low risk of crop damage.",
      recommendations: ["Continue regular monitoring", "Maintain current practices"],
    };
  }

  const recs = damageType === "crop_lodging" ? lodgingRecommendations : combinedRecommendations;
  return {
    damageType,
    severity,
    confidence: Math.round((75 + Math.random() * 20) * 10) / 10,
    areaAffected: Math.round((riskScore * 8 + Math.random() * 15) * 10) / 10,
    description: damageType === "crop_lodging"
      ? "Environmental conditions suggest high risk of crop lodging."
      : "Multiple risk factors detected. High probability of combined damage.",
    recommendations: recs.slice(0, 4),
  };
}
