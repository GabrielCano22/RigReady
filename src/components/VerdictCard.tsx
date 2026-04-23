import { AlertTriangle, Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import type {
  EvaluateRawgResponse,
  EvaluateResponse,
  Game,
  HardwareComponent,
  Verdict,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const MAX_SCORE = 1000;

const verdictVariantMap: Record<
  Verdict,
  "danger" | "warning" | "success" | "info"
> = {
  incompatible: "danger",
  low: "warning",
  recommended: "success",
  ultra: "info",
};

const verdictEmojiMap: Record<Verdict, string> = {
  incompatible: "🔴",
  low: "🟡",
  recommended: "🟢",
  ultra: "🔵",
};

interface VerdictCardProps {
  result: EvaluateResponse | EvaluateRawgResponse;
  cpu: HardwareComponent | undefined;
  gpu: HardwareComponent | undefined;
  ram: number;
  game: Game | undefined;
}

function PassFail({ pass }: { pass: boolean }) {
  const { t } = useTranslation("common");
  return pass ? (
    <span
      className="inline-flex items-center gap-1 text-emerald-400"
      title={t("verdict.table.pass")}
      aria-label={t("verdict.table.pass")}
    >
      <Check className="h-4 w-4" /> {t("verdict.table.pass")}
    </span>
  ) : (
    <span
      className="inline-flex items-center gap-1 text-red-400"
      title={t("verdict.table.fail")}
      aria-label={t("verdict.table.fail")}
    >
      <X className="h-4 w-4" /> {t("verdict.table.fail")}
    </span>
  );
}

export function VerdictCard({ result, cpu, gpu, ram, game }: VerdictCardProps) {
  const { t } = useTranslation("common");

  const verdictVariant = verdictVariantMap[result.verdict];
  const verdictLabel = `${verdictEmojiMap[result.verdict]} ${t(
    `verdict.labels.${result.verdict}`,
  )}`;

  const userPct = Math.min(100, Math.round((result.userScore.total / MAX_SCORE) * 100));
  const demandPct = Math.min(100, Math.round((result.gameDemand.total / MAX_SCORE) * 100));
  const recommended = game?.recommended;

  // Determine bottleneck direction from scores (ignore backend english string).
  const bottleneckKey: "bottleneckCpu" | "bottleneckGpu" =
    result.userScore.cpu <= result.userScore.gpu ? "bottleneckCpu" : "bottleneckGpu";

  const isEstimated = (result as EvaluateRawgResponse).estimated === true;

  return (
    <Card className="flex flex-col gap-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-muted-foreground">
          {t("verdict.title")}
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge variant={verdictVariant} className="text-sm px-3 py-1">
            {verdictLabel}
          </Badge>
          {isEstimated && (
            <Badge variant="info" className="text-xs">
              {t("verdict.estimatedBadge")}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {result.platformMismatch && (
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t("verdict.platformMismatchTitle")}</AlertTitle>
            <AlertDescription>
              {t("verdict.platformMismatchMessage")}
            </AlertDescription>
          </Alert>
        )}

        {result.bottleneck && (
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t("verdict.bottleneckTitle")}</AlertTitle>
            <AlertDescription>{t(`verdict.${bottleneckKey}`)}</AlertDescription>
          </Alert>
        )}

        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">{t("verdict.table.spec")}</th>
                <th className="px-3 py-2 font-medium">{t("verdict.table.yourRig")}</th>
                <th className="px-3 py-2 font-medium">
                  {t("verdict.table.recommended")}
                </th>
                <th className="px-3 py-2 font-medium">{t("verdict.table.result")}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border">
                <td className="px-3 py-2 font-medium">CPU</td>
                <td className="px-3 py-2 text-muted-foreground truncate">
                  {cpu?.name ?? "—"}{" "}
                  <span className="opacity-60">({result.userScore.cpu})</span>
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {recommended
                    ? t("verdict.table.scoreMin", { value: recommended.cpuScore })
                    : "—"}
                </td>
                <td className="px-3 py-2">
                  <PassFail pass={result.checks.cpu} />
                </td>
              </tr>
              <tr className="border-t border-border">
                <td className="px-3 py-2 font-medium">GPU</td>
                <td className="px-3 py-2 text-muted-foreground truncate">
                  {gpu?.name ?? "—"}{" "}
                  <span className="opacity-60">({result.userScore.gpu})</span>
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {recommended
                    ? t("verdict.table.scoreMin", { value: recommended.gpuScore })
                    : "—"}
                </td>
                <td className="px-3 py-2">
                  <PassFail pass={result.checks.gpu} />
                </td>
              </tr>
              <tr className="border-t border-border">
                <td className="px-3 py-2 font-medium">RAM</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {t("verdict.table.ramValue", { value: ram })}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {recommended
                    ? t("verdict.table.ramValue", { value: recommended.ram })
                    : "—"}
                </td>
                <td className="px-3 py-2">
                  <PassFail pass={result.checks.ram} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={cn("space-y-4")}>
          <div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium">{t("verdict.meters.userScore")}</span>
              <span className="text-muted-foreground">
                {result.userScore.total} / {MAX_SCORE}
              </span>
            </div>
            <Progress value={userPct} />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium">{t("verdict.meters.gameDemand")}</span>
              <span className="text-muted-foreground">
                {result.gameDemand.total} / {MAX_SCORE}
              </span>
            </div>
            <Progress value={demandPct} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
