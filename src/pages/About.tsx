import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, type Easing } from "framer-motion";
import { CheckCircle2, Cpu, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { CardTilt, CardTiltContent } from "@/components/ui/card-tilt";

const EASE_OUT_EXPO: Easing = [0.22, 1, 0.36, 1];
const HERO_ANIM_DURATION_S = 0.6;
const STEP_ANIM_DURATION_S = 0.5;
const STEP_STAGGER_S = 0.1;
const VALUE_STAGGER_S = 0.08;
const VIEWPORT_MARGIN = "-40px";
const HERO_VIGNETTE =
  "radial-gradient(ellipse at center, transparent 30%, #0d0d0d 85%)";

interface Step {
  n: string;
  icon: React.ReactNode;
  titleKey: string;
  bodyKey: string;
}

const STEPS: Step[] = [
  { n: "01", icon: <Cpu className="h-4 w-4" />, titleKey: "about.step1.title", bodyKey: "about.step1.body" },
  { n: "02", icon: <Gamepad2 className="h-4 w-4" />, titleKey: "about.step2.title", bodyKey: "about.step2.body" },
  { n: "03", icon: <CheckCircle2 className="h-4 w-4" />, titleKey: "about.step3.title", bodyKey: "about.step3.body" },
];

const VALUE_KEYS = ["community", "noBs", "realData", "spanishFirst"] as const;

/**
 * Hero band with the scan-sweep grid background and a soft radial vignette
 * so the illuminated edges blend into the surrounding card background.
 */
function AboutHero() {
  const { t } = useTranslation("common");
  return (
    <section className="scan-sweep relative overflow-hidden border-b border-dashed border-border bg-grid">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: HERO_VIGNETTE }}
      />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: HERO_ANIM_DURATION_S }}
        className="relative z-10 px-6 py-14 text-center md:px-12"
      >
        <span className="mb-5 inline-block rounded-sm border border-primary/30 bg-primary/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.3em] text-primary">
          {t("about.tag")}
        </span>
        <h1 className="mb-4 text-balance font-mono text-[clamp(28px,4vw,44px)] font-bold leading-[1.1] tracking-tight text-foreground">
          {t("about.heroLine1")}
          <br />
          {t("about.heroMid")} <span className="text-primary">{t("about.heroCyan")}</span>
        </h1>
        <p className="mx-auto max-w-xl text-balance text-muted-foreground">
          {t("about.intro")}
        </p>
      </motion.div>
    </section>
  );
}

/**
 * Three-step "how it works" grid. Each cell uses a cursor-parallax tilt so
 * the numbered plates feel tactile on pointer devices.
 */
function StepsSection() {
  const { t } = useTranslation("common");
  return (
    <section>
      <div className="border-b border-dashed border-border px-6 pt-6 pb-3 md:px-8">
        <div className="label-mono">{t("about.howItWorks")}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3">
        {STEPS.map((step, index) => {
          const notLast = index < STEPS.length - 1;
          return (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: VIEWPORT_MARGIN }}
              transition={{
                delay: index * STEP_STAGGER_S,
                duration: STEP_ANIM_DURATION_S,
                ease: EASE_OUT_EXPO,
              }}
              className={notLast ? "border-b border-dashed border-border md:border-b-0 md:border-r" : ""}
            >
              <CardTilt tiltMaxAngle={6} scale={1.02} className="block h-full w-full">
                <CardTiltContent className="p-6 md:p-7">
                  <div className="mb-2 font-mono text-[32px] font-bold leading-none text-[#1a1a1a]">
                    {step.n}
                  </div>
                  <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-sm border border-dashed border-border text-primary">
                    {step.icon}
                  </div>
                  <h3 className="mb-1.5 font-mono text-sm font-bold text-foreground">
                    {t(step.titleKey)}
                  </h3>
                  <p className="text-sm text-muted-foreground">{t(step.bodyKey)}</p>
                </CardTiltContent>
              </CardTilt>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

/**
 * Two-column grid of project values. Dashed dividers are conditionally
 * applied so the bottom row and right column don't get trailing borders.
 */
function ValuesSection() {
  const { t } = useTranslation("common");
  return (
    <section>
      <div className="border-y border-dashed border-border px-6 pt-6 pb-3 md:px-8">
        <div className="label-mono">{t("about.valuesTitle")}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2">
        {VALUE_KEYS.map((key, index) => {
          const isLastRow = index >= VALUE_KEYS.length - 2;
          const isRightColumn = index % 2 === 1;
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: VIEWPORT_MARGIN }}
              transition={{
                delay: index * VALUE_STAGGER_S,
                duration: STEP_ANIM_DURATION_S,
                ease: EASE_OUT_EXPO,
              }}
              className={[
                !isRightColumn ? "md:border-r md:border-dashed md:border-border" : "",
                !isLastRow ? "border-b border-dashed border-border" : "",
              ].join(" ")}
            >
              <SpotlightCard className="h-full p-6 md:p-7" spotlightColor="0, 255, 255">
                <div className="mb-1.5 flex items-center gap-2 font-mono text-[12px] font-bold tracking-wide text-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                  {t(`about.values.${key}.head`)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {t(`about.values.${key}.body`)}
                </p>
              </SpotlightCard>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

/** Bottom CTA strip that sends visitors back into the evaluator. */
function CallToActionStrip() {
  const { t } = useTranslation("common");
  return (
    <section className="flex flex-col items-center gap-3 border-t border-dashed border-border px-6 py-8 text-center md:px-8">
      <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        {t("about.ctaLead")}
      </p>
      <Button
        asChild
        size="lg"
        className="btn-shimmer glow-cyan rounded-full font-mono text-[11px] font-bold uppercase tracking-wider"
      >
        <Link to="/evaluator">
          <Gamepad2 className="mr-2 h-4 w-4" />
          {t("header.cta")}
        </Link>
      </Button>
    </section>
  );
}

/**
 * `/about` page. Composes the hero, three-step explainer, values grid, and
 * a bottom CTA inside a single bordered card.
 */
export default function About() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-10 pb-16 sm:px-6">
        <div className="overflow-hidden rounded border border-border bg-card">
          <AboutHero />
          <StepsSection />
          <ValuesSection />
          <CallToActionStrip />
        </div>
      </main>
      <Footer />
    </div>
  );
}
