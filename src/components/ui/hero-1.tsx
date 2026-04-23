import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Cpu, Gamepad2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LogosSection } from "@/components/ui/logos-section";
import { BackgroundMeteors } from "@/components/ui/background-meteors";
import { StaggerChars } from "@/components/ui/stagger-chars";

const CONTENT_EASE = [0.22, 1, 0.36, 1] as const;
const CONTENT_ENTER_DURATION = 0.6;
const SUBTITLE_DELAY = 0.3;
const CTA_DELAY = 0.4;
const CTA_ENTER_DURATION = 0.5;
const STAGGER_CHAR_DELAY = 0.04;
const STAGGER_CHAR_DURATION = 0.7;

/**
 * Landing-page hero section. Renders the animated grid-and-meteors
 * background, the kinetic headline, the primary/secondary calls to action,
 * and the trust-strip carousel as one cohesive panel.
 */
export function HeroSection() {
  const { t } = useTranslation("common");

  return (
    <section className="relative mx-auto w-full max-w-5xl px-4 pt-12 md:pt-16">
      <div className="relative overflow-hidden rounded border border-border bg-[#0a0a0a] bg-scanlines">
        <BackgroundMeteors />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: CONTENT_ENTER_DURATION, ease: CONTENT_EASE }}
          className="relative z-10 flex flex-col items-center px-6 py-16 text-center md:px-10 md:py-24"
        >
          <h1 className="mb-4 max-w-3xl text-balance font-mono text-[clamp(32px,6vw,60px)] font-bold leading-[1.05] tracking-tight">
            <span className="text-foreground">{t("hero.titleLine1")}</span>
            <br />
            <span className="text-outline-cyan">{t("hero.titleWordOutline")}</span>{" "}
            <span className="text-foreground">{t("hero.titleWordMid")}</span>{" "}
            <StaggerChars
              text={t("hero.titleWordCyan")}
              className="text-primary"
              hoverClassName="text-foreground"
              delay={STAGGER_CHAR_DELAY}
              duration={STAGGER_CHAR_DURATION}
            />
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: SUBTITLE_DELAY, duration: CONTENT_ENTER_DURATION }}
            className="mb-8 max-w-xl text-balance text-base text-muted-foreground md:text-lg"
          >
            {t("hero.subtitle")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: CTA_DELAY, duration: CTA_ENTER_DURATION }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <Button
              asChild
              size="lg"
              className="btn-shimmer glow-cyan rounded-full font-mono text-[12px] font-bold uppercase tracking-wider"
            >
              <Link to="/evaluator">
                <Gamepad2 className="mr-2 h-4 w-4" />
                {t("hero.ctaPrimary")}
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="btn-shimmer rounded-full border border-border bg-secondary/60 font-mono text-[12px] font-bold uppercase tracking-wider text-foreground hover:bg-secondary"
            >
              <Link to="/about">
                <Cpu className="mr-2 h-4 w-4" />
                {t("hero.ctaSecondary")}
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        <div className="relative z-10">
          <LogosSection />
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
