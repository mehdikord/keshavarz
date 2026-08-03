export type MeMapsLayerId = "satellite" | "hybrid" | "street";

export interface MeMapsLayerConfig {
  id: MeMapsLayerId;
  label: string;
  url: string;
  attribution: string;
  maxZoom: number;
}

export const MEMAPS_LAYERS: Record<MeMapsLayerId, MeMapsLayerConfig> = {
  satellite: {
    id: "satellite",
    label: "ماهواره‌ای",
    url: "https://memaps.ir/api/google-earth/satellite/{z}/{x}/{y}.png",
    attribution: "© Google Earth via Memaps.ir",
    maxZoom: 20,
  },
  hybrid: {
    id: "hybrid",
    label: "ترکیبی",
    url: "https://memaps.ir/api/google-earth/hybrid/{z}/{x}/{y}.png",
    attribution: "© Google Earth via Memaps.ir",
    maxZoom: 20,
  },
  street: {
    id: "street",
    label: "نقشه",
    url: "https://memaps.ir/hot/{z}/{x}/{y}.png",
    attribution: "© می‌مپس",
    maxZoom: 18,
  },
};

export const DEFAULT_MEMAPS_LAYER: MeMapsLayerId = "satellite";
