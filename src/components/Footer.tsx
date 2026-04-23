import { Logo } from "./Logo";

const AUTHOR_NAME = "Gabriel Cano";
const AUTHOR_URL = "https://github.com/GabrielCano22";
const REPO_URL = "https://github.com/GabrielCano22/RigReady";

const GITHUB_MARK_PATH =
  "M12 .5C5.73.5.77 5.46.77 11.73c0 4.98 3.23 9.2 7.71 10.69.56.1.77-.24.77-.54 0-.27-.01-1.16-.02-2.1-3.14.68-3.8-1.34-3.8-1.34-.52-1.3-1.27-1.65-1.27-1.65-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.68 1.24 3.33.95.1-.74.4-1.24.72-1.53-2.5-.28-5.13-1.25-5.13-5.57 0-1.23.44-2.24 1.17-3.03-.12-.29-.51-1.44.11-3 0 0 .96-.31 3.15 1.16.91-.25 1.89-.38 2.86-.38.97 0 1.95.13 2.86.38 2.19-1.47 3.15-1.16 3.15-1.16.62 1.56.23 2.71.11 3 .73.79 1.17 1.8 1.17 3.03 0 4.33-2.63 5.28-5.14 5.56.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.13 0 .3.2.65.78.54 4.48-1.49 7.7-5.71 7.7-10.69C23.23 5.46 18.27.5 12 .5Z";

/**
 * Inline GitHub "mark" glyph. Lives next to the footer because lucide-react
 * does not ship a GitHub icon at the moment and we did not want to pull in
 * another icon set for a single usage.
 */
function GitHubMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-3.5 w-3.5 fill-current"
    >
      <path d={GITHUB_MARK_PATH} />
    </svg>
  );
}

/**
 * Site-wide footer. Shows the logo, a single-line copyright with a link to
 * the author's profile, and a GitHub repo link.
 */
export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-border/60 bg-background/50">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <Logo />
        <p className="font-mono text-[11px] tracking-wide text-muted-foreground">
          &copy; {year} <span className="text-foreground">RigReady</span>
          {" | "}
          Creado por{" "}
          <a
            href={AUTHOR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary transition-colors hover:text-foreground"
          >
            {AUTHOR_NAME}
          </a>
        </p>
        <nav
          className="flex items-center gap-4 text-xs text-muted-foreground"
          aria-label="Footer"
        >
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors hover:text-primary"
          >
            <GitHubMark />
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}

export default Footer;
