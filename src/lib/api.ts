import type {
  EvaluateRawgRequest,
  EvaluateRawgResponse,
  HardwareComponent,
  RawgSearchResponse,
  RawgSearchResult,
} from "./types";
import { RawgUnavailableError } from "./types";

export const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    if (res.status === 503) {
      throw new RawgUnavailableError();
    }
    throw new Error(`Request failed ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

export function getCpus(
  platform?: "desktop" | "laptop",
): Promise<HardwareComponent[]> {
  const qs = platform ? `?platform=${platform}` : "";
  return request<HardwareComponent[]>(`/api/cpus${qs}`);
}

export function getGpus(
  platform?: "desktop" | "laptop",
): Promise<HardwareComponent[]> {
  const qs = platform ? `?platform=${platform}` : "";
  return request<HardwareComponent[]>(`/api/gpus${qs}`);
}

export async function searchRawgGames(q: string): Promise<RawgSearchResult[]> {
  // Source swapped from RAWG (RapidAPI key rejected upstream) to Steam Store API.
  // Same response shape so downstream code is untouched.
  const res = await request<RawgSearchResponse>(
    `/api/steam/search?q=${encodeURIComponent(q)}`,
  );
  return res.results;
}

export function evaluateRawg(
  body: EvaluateRawgRequest,
): Promise<EvaluateRawgResponse> {
  return request<EvaluateRawgResponse>("/api/evaluate/rawg", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
