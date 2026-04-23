import * as React from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { MenuToggleIcon } from "@/components/ui/menu-toggle-icon";
import { useScroll } from "@/components/ui/use-scroll";

const SCROLL_THRESHOLD_PX = 8;
const LANG_STORAGE_KEYS = ["i18nextLng", "rigready_lang"] as const;
const SUPPORTED_LANGS = ["es", "en"] as const;

type SupportedLang = (typeof SUPPORTED_LANGS)[number];

type NavLink =
  | { key: string; label: string; to: string; kind: "internal" }
  | { key: string; label: string; href: string; kind: "anchor" };

/**
 * Persists the active language code to every known storage key. Runs inside
 * a try/catch because Safari private mode throws on `localStorage.setItem`.
 */
function persistLanguage(code: SupportedLang): void {
  try {
    for (const key of LANG_STORAGE_KEYS) {
      localStorage.setItem(key, code);
    }
  } catch {
    /* storage unavailable — language still switches in-memory */
  }
}

/**
 * Two-button language toggle. Shows the active language as a filled pill and
 * writes the choice through both i18next and our own storage key.
 */
function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n: i18nHook } = useTranslation("common");
  const current = (i18nHook.resolvedLanguage || i18nHook.language || "es").slice(0, 2);

  const change = (code: SupportedLang) => {
    void i18n.changeLanguage(code);
    persistLanguage(code);
  };

  return (
    <div className={cn("flex items-center gap-1 rounded-full border border-border/80 bg-card/40 p-0.5", className)}>
      {SUPPORTED_LANGS.map((code) => {
        const active = current === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => change(code)}
            aria-pressed={active}
            className={cn(
              "h-7 w-9 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Locks `document.body` scroll while `locked` is true. Restores the previous
 * inline overflow value on cleanup so we never trample an ambient setting.
 */
function useBodyScrollLock(locked: boolean): void {
  React.useEffect(() => {
    if (!locked) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [locked]);
}

interface DesktopNavProps {
  links: NavLink[];
  pathname: string;
}

function DesktopNav({ links, pathname }: DesktopNavProps) {
  return (
    <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
      {links.map((link) =>
        link.kind === "internal" ? (
          <Link
            key={link.key}
            to={link.to}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === link.to ? "text-primary" : "text-muted-foreground",
            )}
          >
            {link.label}
          </Link>
        ) : (
          <a
            key={link.key}
            href={link.href}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            {link.label}
          </a>
        ),
      )}
    </nav>
  );
}

interface MobileMenuProps {
  open: boolean;
  links: NavLink[];
  pathname: string;
  ctaLabel: string;
  onClose: () => void;
}

/**
 * Portalled mobile navigation drawer. Rendered into `document.body` so the
 * backdrop-blur panel escapes any stacking context the header sits inside.
 */
function MobileMenu({ open, links, pathname, ctaLabel, onClose }: MobileMenuProps) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className={cn(
        "fixed inset-x-0 top-16 z-30 origin-top transition-all duration-300 md:hidden",
        open
          ? "pointer-events-auto opacity-100 translate-y-0"
          : "pointer-events-none opacity-0 -translate-y-2",
      )}
      aria-hidden={!open}
    >
      <div className="mx-4 rounded-2xl border border-border/60 bg-background/95 p-4 shadow-xl backdrop-blur">
        <div className="mb-4 flex justify-center">
          <LanguageSwitcher />
        </div>
        <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
          {links.map((link) =>
            link.kind === "internal" ? (
              <Link
                key={link.key}
                to={link.to}
                className={cn(
                  "rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-accent",
                  pathname === link.to ? "text-primary" : "text-foreground",
                )}
                onClick={onClose}
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.key}
                href={link.href}
                className="rounded-md px-3 py-2 text-base font-medium text-foreground transition-colors hover:bg-accent"
                onClick={onClose}
              >
                {link.label}
              </a>
            ),
          )}
        </nav>
        <div className="mt-4">
          <Button asChild size="lg" className="w-full rounded-full">
            <Link to="/evaluator" onClick={onClose}>
              {ctaLabel}
            </Link>
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Sticky site header. Applies a translucent backdrop once the page has
 * scrolled past {@link SCROLL_THRESHOLD_PX}, renders the desktop nav inline,
 * and portals the mobile drawer outside the header's stacking context.
 */
export function Header() {
  const { t } = useTranslation("common");
  const scrolled = useScroll(SCROLL_THRESHOLD_PX);
  const [open, setOpen] = React.useState(false);
  const location = useLocation();

  React.useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useBodyScrollLock(open);

  const links: NavLink[] = [
    { key: "home", label: t("header.home"), to: "/", kind: "internal" },
    { key: "evaluator", label: t("header.evaluator"), to: "/evaluator", kind: "internal" },
    { key: "about", label: t("header.about"), to: "/about", kind: "internal" },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        scrolled
          ? "border-b border-border/60 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center" aria-label="RigReady home">
          <Logo />
        </Link>

        <DesktopNav links={links} pathname={location.pathname} />

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          <Button asChild size="sm" className="btn-shimmer rounded-full font-mono text-[11px] font-bold tracking-wider">
            <Link to="/evaluator">{t("header.cta")} →</Link>
          </Button>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <MenuToggleIcon open={open} className="h-6 w-6" />
        </button>
      </div>

      <MobileMenu
        open={open}
        links={links}
        pathname={location.pathname}
        ctaLabel={t("header.cta")}
        onClose={() => setOpen(false)}
      />
    </header>
  );
}

export default Header;
