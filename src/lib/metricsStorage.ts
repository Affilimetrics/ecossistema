import {
  STANDARD_METRICS,
  type StandardMetricId,
} from "./metricsFormulas";

export const CUSTOM_SECTION_STORAGE_KEY = "scallora:metrics:custom-section:v2";
const DELETED_SENTINEL = "__DELETED__";

export interface CustomSectionConfig {
  sectionTitle: string;
  selectedMetricIds: StandardMetricId[];
}

const VALID_METRIC_IDS = new Set<string>(
  STANDARD_METRICS.map((metric) => metric.id)
);

// Por padrão, inicia com as 3 métricas extras reservadas do RF013 selecionadas
export const DEFAULT_CUSTOM_SECTION: CustomSectionConfig = {
  sectionTitle: "Minha seção personalizada",
  selectedMetricIds: ["cpa", "cliquesTotais", "taxaReembolso"],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateSectionConfig(raw: unknown): CustomSectionConfig | null {
  if (!isRecord(raw)) return null;

  const sectionTitle =
    typeof raw.sectionTitle === "string" && raw.sectionTitle.trim()
      ? raw.sectionTitle.trim()
      : DEFAULT_CUSTOM_SECTION.sectionTitle;

  const selectedMetricIds: StandardMetricId[] = [];
  if (Array.isArray(raw.selectedMetricIds)) {
    const seen = new Set<string>();
    for (const item of raw.selectedMetricIds) {
      if (
        typeof item === "string" &&
        VALID_METRIC_IDS.has(item) &&
        !seen.has(item)
      ) {
        seen.add(item);
        selectedMetricIds.push(item as StandardMetricId);
      }
    }
  }

  return {
    sectionTitle,
    selectedMetricIds,
  };
}

export function loadCustomSectionConfig(): CustomSectionConfig | null {
  if (typeof window === "undefined") {
    return {
      ...DEFAULT_CUSTOM_SECTION,
      selectedMetricIds: [...DEFAULT_CUSTOM_SECTION.selectedMetricIds],
    };
  }

  try {
    const rawJson = window.localStorage.getItem(CUSTOM_SECTION_STORAGE_KEY);
    if (!rawJson) {
      return {
        ...DEFAULT_CUSTOM_SECTION,
        selectedMetricIds: [...DEFAULT_CUSTOM_SECTION.selectedMetricIds],
      };
    }

    if (rawJson === DELETED_SENTINEL) {
      return null;
    }

    const parsed: unknown = JSON.parse(rawJson);
    const validated = validateSectionConfig(parsed);
    if (!validated) {
      return {
        ...DEFAULT_CUSTOM_SECTION,
        selectedMetricIds: [...DEFAULT_CUSTOM_SECTION.selectedMetricIds],
      };
    }

    return validated;
  } catch {
    return {
      ...DEFAULT_CUSTOM_SECTION,
      selectedMetricIds: [...DEFAULT_CUSTOM_SECTION.selectedMetricIds],
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
    // Falha silenciosa caso localStorage esteja bloqueado
  }
}

export function deleteCustomSectionConfig(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(CUSTOM_SECTION_STORAGE_KEY, DELETED_SENTINEL);
  } catch {
    // Falha silenciosa
  }
}

export function resetCustomSectionConfig(): CustomSectionConfig {
  const fresh: CustomSectionConfig = {
    ...DEFAULT_CUSTOM_SECTION,
    selectedMetricIds: [...DEFAULT_CUSTOM_SECTION.selectedMetricIds],
  };
  saveCustomSectionConfig(fresh);
  return fresh;
}