import {
  STANDARD_METRICS,
  type MetricFormatType,
  type StandardMetricId,
} from "./metricsFormulas";

export const CUSTOM_SECTION_STORAGE_KEY = "scallora:metrics:custom-section:v1";

export interface CustomMetricDefinition {
  id: string;
  title: string;
  description: string;
  formula: string;
  format: MetricFormatType;
}

export interface CustomSectionConfig {
  sectionTitle: string;
  selectedStandardIds: StandardMetricId[];
  customMetrics: CustomMetricDefinition[];
}

const VALID_STANDARD_IDS = new Set<string>(
  STANDARD_METRICS.map((metric) => metric.id)
);

const VALID_FORMATS = new Set<string>(["currency", "percent", "integer"]);

export const DEFAULT_CUSTOM_SECTION: CustomSectionConfig = {
  sectionTitle: "Minha seção personalizada",
  selectedStandardIds: ["roi", "lucroLiquido", "taxaConversao", "cpa"],
  customMetrics: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeCustomMetric(raw: unknown): CustomMetricDefinition | null {
  if (!isRecord(raw)) return null;

  const id = typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : null;
  const title =
    typeof raw.title === "string" && raw.title.trim() ? raw.title.trim() : null;
  const formula =
    typeof raw.formula === "string" && raw.formula.trim()
      ? raw.formula.trim()
      : null;
  const description =
    typeof raw.description === "string" ? raw.description.trim() : "";
  const format =
    typeof raw.format === "string" && VALID_FORMATS.has(raw.format)
      ? (raw.format as MetricFormatType)
      : "number" === raw.format
      ? "integer"
      : null;

  if (!id || !title || !formula || !format) {
    return null;
  }

  return {
    id,
    title,
    description,
    formula,
    format,
  };
}

function validateSectionConfig(raw: unknown): CustomSectionConfig | null {
  if (!isRecord(raw)) return null;

  const sectionTitle =
    typeof raw.sectionTitle === "string" && raw.sectionTitle.trim()
      ? raw.sectionTitle.trim()
      : DEFAULT_CUSTOM_SECTION.sectionTitle;

  const selectedStandardIds: StandardMetricId[] = [];
  if (Array.isArray(raw.selectedStandardIds)) {
    const seen = new Set<string>();
    for (const item of raw.selectedStandardIds) {
      if (
        typeof item === "string" &&
        VALID_STANDARD_IDS.has(item) &&
        !seen.has(item)
      ) {
        seen.add(item);
        selectedStandardIds.push(item as StandardMetricId);
      }
    }
  }

  const customMetrics: CustomMetricDefinition[] = [];
  if (Array.isArray(raw.customMetrics)) {
    const seenIds = new Set<string>();
    for (const item of raw.customMetrics) {
      const parsed = sanitizeCustomMetric(item);
      if (parsed && !seenIds.has(parsed.id)) {
        seenIds.add(parsed.id);
        customMetrics.push(parsed);
      }
    }
  }

  return {
    sectionTitle,
    selectedStandardIds,
    customMetrics,
  };
}

export function loadCustomSectionConfig(): CustomSectionConfig {
  if (typeof window === "undefined") {
    return {
      ...DEFAULT_CUSTOM_SECTION,
      selectedStandardIds: [...DEFAULT_CUSTOM_SECTION.selectedStandardIds],
      customMetrics: [],
    };
  }

  try {
    const rawJson = window.localStorage.getItem(CUSTOM_SECTION_STORAGE_KEY);
    if (!rawJson) {
      return {
        ...DEFAULT_CUSTOM_SECTION,
        selectedStandardIds: [...DEFAULT_CUSTOM_SECTION.selectedStandardIds],
        customMetrics: [],
      };
    }

    const parsed: unknown = JSON.parse(rawJson);
    const validated = validateSectionConfig(parsed);
    if (!validated) {
      return {
        ...DEFAULT_CUSTOM_SECTION,
        selectedStandardIds: [...DEFAULT_CUSTOM_SECTION.selectedStandardIds],
        customMetrics: [],
      };
    }

    return validated;
  } catch {
    return {
      ...DEFAULT_CUSTOM_SECTION,
      selectedStandardIds: [...DEFAULT_CUSTOM_SECTION.selectedStandardIds],
      customMetrics: [],
    };
  }
}

export function saveCustomSectionConfig(config: CustomSectionConfig): void {
  if (typeof window === "undefined") return;

  try {
    const sanitized =
      validateSectionConfig(config) ?? DEFAULT_CUSTOM_SECTION;
    window.localStorage.setItem(
      CUSTOM_SECTION_STORAGE_KEY,
      JSON.stringify(sanitized)
    );
  } catch {
    // Falha silenciosa caso o navegador bloqueie localStorage ou exceda cota
  }
}

export function resetCustomSectionConfig(): CustomSectionConfig {
  const fresh: CustomSectionConfig = {
    ...DEFAULT_CUSTOM_SECTION,
    selectedStandardIds: [...DEFAULT_CUSTOM_SECTION.selectedStandardIds],
    customMetrics: [],
  };
  saveCustomSectionConfig(fresh);
  return fresh;
}