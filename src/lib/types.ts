export type FormFactor = "desktop" | "laptop";
export type Verdict = "incompatible" | "low" | "recommended" | "ultra";
export type Platform = "desktop" | "laptop" | "integrated";
export type Vendor = "Intel" | "AMD" | "NVIDIA" | "Apple";

export interface HardwareComponent {
  id: string;
  name: string;
  score: number;
  platform: Platform;
  vendor?: Vendor;
  integratedGpuId?: string;
}

export interface TierReq {
  cpuScore: number;
  gpuScore: number;
  ram: number;
}

export interface EvaluateResponse {
  verdict: Verdict;
  bottleneck: boolean;
  bottleneckMessage?: string;
  userScore: { cpu: number; gpu: number; ram: number; total: number };
  gameDemand: { cpu: number; gpu: number; ram: number; total: number };
  checks: { cpu: boolean; gpu: boolean; ram: boolean };
  platformMismatch?: boolean;
  platformMismatchMessage?: string;
}

/** Game search result from Steam (formerly RAWG). Field names preserved for
 *  backwards-compat with existing components. */
export interface RawgSearchResult {
  id: number;
  slug: string;
  name: string;
  released: string | null;
  background_image: string | null;
  rating: number;
  genres: string[];
}

export interface RawgSearchResponse {
  results: RawgSearchResult[];
}

export interface RawgGamePayload {
  slug: string;
  name: string;
  released: string | null;
  genres: string[];
}

export interface EvaluateRawgRequest {
  cpuId: string;
  gpuId: string;
  ram: number;
  formFactor: FormFactor;
  rawgGame: RawgGamePayload;
}

export interface EvaluateRawgResponse extends EvaluateResponse {
  estimated: true;
  rawgName: string;
}

export class RawgUnavailableError extends Error {
  constructor(message = "Game search unavailable") {
    super(message);
    this.name = "RawgUnavailableError";
  }
}
