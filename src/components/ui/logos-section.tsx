import { useTranslation } from "react-i18next";
import { InfiniteSlider } from "@/components/ui/infinite-slider";

const SIMPLE_ICONS_CDN = "https://cdn.simpleicons.org";
const LOGO_TINT_HEX = "888888";
const FADE_BG = "#0a0a0a";
const CAROUSEL_GAP_PX = 56;
const CAROUSEL_DURATION_S = 32;
const CAROUSEL_HOVER_DURATION_S = 80;

interface Brand {
  name: string;
  /** Simple-icons slug, or `null` when the CDN has no reliable wordmark. */
  slug: string | null;
}

/**
 * Brands whose logos are confirmed to resolve on cdn.simpleicons.org.
 * Brands lacking a good monochrome wordmark render as Space Mono text so the
 * carousel never breaks on a 404.
 */
const BRANDS: Brand[] = [
  { name: "NVIDIA", slug: "nvidia" },
  { name: "AMD", slug: "amd" },
  { name: "Intel", slug: "intel" },
  { name: "Steam", slug: "steam" },
  { name: "Apple", slug: "apple" },
  { name: "Ryzen", slug: null },
  { name: "GeForce", slug: null },
  { name: "Qualcomm", slug: null },
  { name: "PassMark", slug: null },
];

function BrandWordmark({ name }: { name: string }) {
  return (
    <span className="font-mono text-sm font-bold tracking-wide text-muted-foreground transition-colors hover:text-foreground">
      {name}
    </span>
  );
}

function BrandImage({ brand }: { brand: Brand & { slug: string } }) {
  return (
    <img
      src={`${SIMPLE_ICONS_CDN}/${brand.slug}/${LOGO_TINT_HEX}`}
      alt={brand.name}
      loading="lazy"
      width={96}
      height={28}
      className="h-7 w-auto opacity-80 transition-all duration-200 hover:opacity-100 hover:brightness-150"
      draggable={false}
    />
  );
}

function BrandMark({ brand }: { brand: Brand }) {
  if (!brand.slug) return <BrandWordmark name={brand.name} />;
  return <BrandImage brand={{ ...brand, slug: brand.slug }} />;
}

/**
 * Trust strip shown under the hero. Renders an infinite horizontal carousel
 * of hardware and platform brands with edge fades that blend into the hero
 * background.
 */
export function LogosSection() {
  const { t } = useTranslation("common");

  return (
    <div className="border-t border-dashed border-border px-6 py-8 md:px-10">
      <div className="label-mono mb-5 text-center">{t("logos.title")}</div>
      <div className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20"
          style={{
            background: `linear-gradient(to right, ${FADE_BG}, transparent)`,
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20"
          style={{
            background: `linear-gradient(to left, ${FADE_BG}, transparent)`,
          }}
        />
        <InfiniteSlider
          gap={CAROUSEL_GAP_PX}
          duration={CAROUSEL_DURATION_S}
          durationOnHover={CAROUSEL_HOVER_DURATION_S}
        >
          {BRANDS.map((brand) => (
            <div
              key={brand.name}
              className="flex h-8 shrink-0 items-center justify-center"
            >
              <BrandMark brand={brand} />
            </div>
          ))}
        </InfiniteSlider>
      </div>
    </div>
  );
}

export default LogosSection;
