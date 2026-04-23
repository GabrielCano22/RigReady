import { useEffect, useMemo, useState } from "react";
import { Gamepad2, Laptop, Loader2, Monitor, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/Combobox";
import { VerdictCard } from "@/components/VerdictCard";
import { RevealText } from "@/components/ui/reveal-text";
import { cn } from "@/lib/utils";
import {
  evaluateRawg,
  getCpus,
  getGpus,
  searchRawgGames,
} from "@/lib/api";
import {
  RawgUnavailableError,
  type EvaluateRawgResponse,
  type FormFactor,
  type HardwareComponent,
  type RawgSearchResult,
} from "@/lib/types";

const RAM_OPTIONS = [8, 16, 32, 64, 128] as const;
const DEFAULT_RAM_GB = 16;
const DEFAULT_FORM_FACTOR: FormFactor = "desktop";
const FORM_FACTORS = ["desktop", "laptop"] as const;
const GAME_SEARCH_DEBOUNCE_MS = 300;
const MIN_GAME_QUERY_LEN = 2;

interface FieldLabelProps {
  children: React.ReactNode;
  htmlFor?: string;
}

function FieldLabel({ children, htmlFor }: FieldLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground"
    >
      {children}
    </label>
  );
}

interface CatalogState {
  cpus: HardwareComponent[];
  gpus: HardwareComponent[];
  loading: boolean;
  error: string | null;
}

/**
 * Loads the CPU and GPU catalogs for the given form factor. Cancels in-flight
 * requests when the form factor changes to avoid a stale response clobbering
 * fresh state.
 */
function useHardwareCatalog(formFactor: FormFactor): CatalogState {
  const [state, setState] = useState<CatalogState>({
    cpus: [],
    gpus: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    (async () => {
      try {
        const [cpus, gpus] = await Promise.all([
          getCpus(formFactor),
          getGpus(formFactor),
        ]);
        if (cancelled) return;
        setState({ cpus, gpus, loading: false, error: null });
      } catch (err) {
        if (cancelled) return;
        setState({
          cpus: [],
          gpus: [],
          loading: false,
          error: err instanceof Error ? err.message : "Failed to load catalog",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [formFactor]);

  return state;
}

interface GameSearchState {
  query: string;
  debounced: string;
  results: RawgSearchResult[];
  loading: boolean;
  unavailable: boolean;
  error: string | null;
  setQuery: (value: string) => void;
}

/**
 * Debounced Steam/RAWG game search. Short-circuits until the query exceeds
 * {@link MIN_GAME_QUERY_LEN} and distinguishes "service unavailable" from
 * generic errors so the UI can surface a softer message.
 */
function useGameSearch(): GameSearchState {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState<RawgSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(
      () => setDebounced(query.trim()),
      GAME_SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (debounced.length < MIN_GAME_QUERY_LEN) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const next = await searchRawgGames(debounced);
        if (cancelled) return;
        setResults(next);
        setUnavailable(false);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof RawgUnavailableError) {
          setUnavailable(true);
          setResults([]);
        } else {
          setError(err instanceof Error ? err.message : "Search failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  return { query, debounced, results, loading, unavailable, error, setQuery };
}

interface FormFactorToggleProps {
  value: FormFactor;
  onChange: (next: FormFactor) => void;
}

function FormFactorToggle({ value, onChange }: FormFactorToggleProps) {
  const { t } = useTranslation("common");
  return (
    <div>
      <FieldLabel>{t("evaluator.formFactor")}</FieldLabel>
      <div className="grid grid-cols-2 overflow-hidden rounded border border-dashed border-border">
        {FORM_FACTORS.map((factor) => {
          const active = value === factor;
          const Icon = factor === "desktop" ? Monitor : Laptop;
          return (
            <button
              key={factor}
              type="button"
              onClick={() => onChange(factor)}
              className={cn(
                "flex items-center justify-center gap-2 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t(`evaluator.${factor}`)}
            </button>
          );
        })}
      </div>
      {value === "laptop" && (
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          {t("evaluator.laptopNote")}
        </p>
      )}
    </div>
  );
}

interface GameSearchFieldProps {
  search: GameSearchState;
  selected: RawgSearchResult | null;
  onSelect: (game: RawgSearchResult | null) => void;
}

function GameSearchField({ search, selected, onSelect }: GameSearchFieldProps) {
  const { t } = useTranslation("common");
  const showEmptyHint =
    !search.loading &&
    !search.unavailable &&
    search.debounced.length >= MIN_GAME_QUERY_LEN &&
    search.results.length === 0 &&
    !search.error;

  return (
    <div>
      <FieldLabel htmlFor="game">{t("evaluator.game")}</FieldLabel>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="game"
          value={search.query}
          onChange={(e) => {
            search.setQuery(e.target.value);
            onSelect(null);
          }}
          placeholder={t("evaluator.gameSource.searchPlaceholder")}
          disabled={search.unavailable}
          className="pl-8"
        />
      </div>

      {search.unavailable && (
        <Alert variant="warning" className="mt-2">
          <AlertTitle>{t("evaluator.gameSource.unavailable")}</AlertTitle>
        </Alert>
      )}

      {search.error && (
        <Alert variant="destructive" className="mt-2">
          <AlertDescription>{search.error}</AlertDescription>
        </Alert>
      )}

      {search.loading && (
        <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          {t("evaluator.gameSource.searching")}
        </p>
      )}

      {showEmptyHint && (
        <p className="mt-2 text-xs text-muted-foreground">
          {t("evaluator.gameSource.noResults")}
        </p>
      )}

      {!search.unavailable && search.results.length > 0 && (
        <ul
          role="listbox"
          className="mt-2 max-h-60 space-y-0 overflow-y-auto rounded border border-dashed border-border bg-[#0f0f0f]"
        >
          {search.results.map((result) => {
            const active = selected?.id === result.id;
            return (
              <li key={result.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => onSelect(result)}
                  className={cn(
                    "flex w-full items-center gap-2.5 border-b border-dashed border-border/60 px-2.5 py-2 text-left text-xs transition-colors last:border-b-0",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {result.background_image ? (
                    <img
                      src={result.background_image}
                      alt=""
                      className="h-6 w-9 shrink-0 rounded-sm object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-6 w-9 shrink-0 rounded-sm border border-dashed border-border bg-muted" />
                  )}
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {result.name}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {selected && (
        <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {t("evaluator.gameSource.selected")}{" "}
          <span className="text-primary">{selected.name}</span>
        </p>
      )}
    </div>
  );
}

interface ResultsPanelProps {
  result: EvaluateRawgResponse | null;
  resultName: string | null;
  cpu: HardwareComponent | undefined;
  gpu: HardwareComponent | undefined;
  ram: number;
}

function ResultsPanel({ result, resultName, cpu, gpu, ram }: ResultsPanelProps) {
  const { t } = useTranslation("common");
  if (!result) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-3 text-center">
        <div className="rounded-full border border-dashed border-primary/40 bg-primary/5 p-4">
          <Gamepad2 className="h-7 w-7 text-primary" />
        </div>
        <p className="max-w-xs text-sm text-muted-foreground">
          {t("evaluator.emptyPlaceholder", { action: t("evaluator.analyze") })}
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {resultName && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-border pb-3">
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {t("evaluator.gameSource.selected")}{" "}
            <span className="text-foreground">{resultName}</span>
          </p>
          <span className="rounded-sm border border-border px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            {t("evaluator.gameSource.estimatedBadge")}
          </span>
        </div>
      )}
      <VerdictCard
        result={result}
        cpu={cpu}
        gpu={gpu}
        ram={ram}
        game={undefined}
      />
    </div>
  );
}

/**
 * `/evaluator` page. Owns the full compatibility-check flow: pick a form
 * factor + CPU + GPU + RAM, search Steam for a target game, then post to the
 * RAWG-estimator endpoint and render the verdict.
 */
export default function Evaluator() {
  const { t } = useTranslation("common");

  const [formFactor, setFormFactor] = useState<FormFactor>(DEFAULT_FORM_FACTOR);
  const catalog = useHardwareCatalog(formFactor);

  const [cpuId, setCpuId] = useState<string | null>(null);
  const [gpuId, setGpuId] = useState<string | null>(null);
  const [ram, setRam] = useState<number>(DEFAULT_RAM_GB);

  useEffect(() => {
    setCpuId(null);
    setGpuId(null);
  }, [formFactor]);

  const gameSearch = useGameSearch();
  const [gameSelected, setGameSelected] = useState<RawgSearchResult | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<EvaluateRawgResponse | null>(null);
  const [resultName, setResultName] = useState<string | null>(null);

  const cpuOptions = useMemo(
    () => catalog.cpus.map((c) => ({ value: c.id, label: c.name, hint: `${c.score}` })),
    [catalog.cpus],
  );
  const gpuOptions = useMemo(() => {
    const igpuBadge = t("gpuGroups.igpuBadge", { defaultValue: "iGPU" });
    const dedicated = catalog.gpus
      .filter((g) => g.platform !== "integrated")
      .map((g) => ({ value: g.id, label: g.name, hint: `${g.score}` }));
    const integrated = catalog.gpus
      .filter((g) => g.platform === "integrated")
      .map((g) => ({ value: g.id, label: `${g.name} · ${igpuBadge}`, hint: `${g.score}` }));
    return [...dedicated, ...integrated];
  }, [catalog.gpus, t]);

  const selectedCpu = catalog.cpus.find((c) => c.id === cpuId);
  const selectedGpu = catalog.gpus.find((g) => g.id === gpuId);

  const canSubmit =
    cpuId !== null &&
    gpuId !== null &&
    gameSelected !== null &&
    !submitting &&
    !catalog.loading;

  async function handleSubmit() {
    if (!cpuId || !gpuId || !gameSelected) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await evaluateRawg({
        cpuId,
        gpuId,
        ram,
        formFactor,
        rawgGame: {
          slug: gameSelected.slug,
          name: gameSelected.name,
          released: gameSelected.released,
          genres: gameSelected.genres,
        },
      });
      setResult(response);
      setResultName(response.rawgName);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Evaluation failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 md:py-12">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 border-b border-dashed border-border pb-5"
      >
        <h1 className="mb-1 font-mono text-2xl font-bold tracking-tight md:text-3xl">
          <RevealText boxClassName="bg-foreground" duration={0.6}>
            {t("evaluator.title")}
          </RevealText>{" "}
          <RevealText
            className="text-primary"
            boxClassName="bg-primary"
            delay={0.25}
            duration={0.6}
          >
            {t("evaluator.titleHighlight")}
          </RevealText>
        </h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="max-w-2xl text-sm text-muted-foreground"
        >
          {t("evaluator.description")}
        </motion.p>
      </motion.header>

      <div className="grid grid-cols-1 gap-0 overflow-hidden rounded border border-border bg-card lg:grid-cols-[340px_1fr]">
        <div className="space-y-4 border-b border-dashed border-border bg-[#0a0a0a] p-6 lg:border-b-0 lg:border-r">
          <div>
            <h2 className="font-mono text-sm font-bold text-foreground">
              {t("evaluator.formTitle")}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("evaluator.formDescription")}
            </p>
          </div>

          {catalog.error && (
            <Alert variant="destructive">
              <AlertTitle>{t("evaluator.catalogError")}</AlertTitle>
              <AlertDescription>{catalog.error}</AlertDescription>
            </Alert>
          )}

          <FormFactorToggle value={formFactor} onChange={setFormFactor} />

          <div>
            <FieldLabel htmlFor="cpu">{t("evaluator.cpu")}</FieldLabel>
            <Combobox
              id="cpu"
              options={cpuOptions}
              value={cpuId}
              onChange={setCpuId}
              placeholder={catalog.loading ? t("evaluator.loadingCpus") : t("evaluator.selectCpu")}
              searchPlaceholder={t("evaluator.searchCpus")}
              disabled={catalog.loading}
            />
          </div>

          <div>
            <FieldLabel htmlFor="gpu">{t("evaluator.gpu")}</FieldLabel>
            <Combobox
              id="gpu"
              options={gpuOptions}
              value={gpuId}
              onChange={setGpuId}
              placeholder={catalog.loading ? t("evaluator.loadingGpus") : t("evaluator.selectGpu")}
              searchPlaceholder={t("evaluator.searchGpus")}
              disabled={catalog.loading}
            />
          </div>

          <div>
            <FieldLabel htmlFor="ram">{t("evaluator.ram")}</FieldLabel>
            <Select value={String(ram)} onValueChange={(value) => setRam(Number(value))}>
              <SelectTrigger id="ram">
                <SelectValue placeholder="RAM" />
              </SelectTrigger>
              <SelectContent>
                {RAM_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option} GB
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <GameSearchField
            search={gameSearch}
            selected={gameSelected}
            onSelect={setGameSelected}
          />

          {submitError && (
            <Alert variant="destructive">
              <AlertTitle>{t("evaluator.evaluationError")}</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            size="lg"
            className="btn-shimmer glow-cyan w-full rounded font-mono text-[11px] font-bold uppercase tracking-[0.15em]"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("evaluator.analyzing")}
              </>
            ) : (
              <>
                <Gamepad2 className="mr-2 h-4 w-4" /> {t("evaluator.analyze")}
              </>
            )}
          </Button>
        </div>

        <div className="bg-grid p-6 md:p-8">
          <ResultsPanel
            result={result}
            resultName={resultName}
            cpu={selectedCpu}
            gpu={selectedGpu}
            ram={ram}
          />
        </div>
      </div>
    </main>
  );
}
