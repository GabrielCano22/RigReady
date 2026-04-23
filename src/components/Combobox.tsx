import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Performance caps: DOM cost dominates cmdk filter cost.
// Render at most TOP_DEFAULT items initially, SEARCH_LIMIT when user types.
const TOP_DEFAULT = 150;
const SEARCH_LIMIT = 300;

function scoreMatch(haystack: string, needle: string): number {
  if (!needle) return 1;
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  if (h === n) return 1000;
  if (h.startsWith(n)) return 500;
  if (h.includes(n)) return 100;
  // fuzzy: all chars appear in order
  let i = 0;
  for (const ch of h) {
    if (ch === n[i]) i++;
    if (i >= n.length) return 10;
  }
  return 0;
}

export interface ComboboxOption {
  value: string;
  label: string;
  hint?: string;
  badge?: string;
}

export interface ComboboxGroup {
  heading: string;
  options: ComboboxOption[];
}

interface ComboboxProps {
  options?: ComboboxOption[];
  groups?: ComboboxGroup[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  id?: string;
}

export function Combobox({
  options,
  groups,
  value,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  disabled,
  id,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const allOptions: ComboboxOption[] = groups
    ? groups.flatMap((g) => g.options)
    : options ?? [];
  const selected = allOptions.find((o) => o.value === value);

  // Pre-filter before handing to cmdk so we only render a bounded set of DOM nodes.
  const { visibleOptions, visibleGroups, truncated } = useMemo(() => {
    const q = search.trim();
    if (!q) {
      // No search — show first TOP_DEFAULT items (already sorted by score on backend)
      if (groups) {
        let remaining = TOP_DEFAULT;
        const vg = groups.map((g) => {
          const take = g.options.slice(0, Math.max(remaining, 0));
          remaining -= take.length;
          return { ...g, options: take };
        });
        return {
          visibleOptions: [] as ComboboxOption[],
          visibleGroups: vg,
          truncated: allOptions.length > TOP_DEFAULT,
        };
      }
      return {
        visibleOptions: (options ?? []).slice(0, TOP_DEFAULT),
        visibleGroups: null,
        truncated: (options ?? []).length > TOP_DEFAULT,
      };
    }
    // Search active — score all options, take top SEARCH_LIMIT
    const scored: Array<{ opt: ComboboxOption; s: number; group?: string }> = [];
    if (groups) {
      for (const g of groups) {
        for (const opt of g.options) {
          const s = scoreMatch(
            `${opt.label} ${opt.hint ?? ""} ${opt.badge ?? ""}`,
            q,
          );
          if (s > 0) scored.push({ opt, s, group: g.heading });
        }
      }
    } else {
      for (const opt of options ?? []) {
        const s = scoreMatch(
          `${opt.label} ${opt.hint ?? ""} ${opt.badge ?? ""}`,
          q,
        );
        if (s > 0) scored.push({ opt, s });
      }
    }
    scored.sort((a, b) => b.s - a.s);
    const top = scored.slice(0, SEARCH_LIMIT);
    if (groups) {
      const byGroup = new Map<string, ComboboxOption[]>();
      for (const { opt, group } of top) {
        const k = group ?? "";
        if (!byGroup.has(k)) byGroup.set(k, []);
        byGroup.get(k)!.push(opt);
      }
      const vg = groups
        .map((g) => ({ ...g, options: byGroup.get(g.heading) ?? [] }))
        .filter((g) => g.options.length > 0);
      return {
        visibleOptions: [] as ComboboxOption[],
        visibleGroups: vg,
        truncated: scored.length > SEARCH_LIMIT,
      };
    }
    return {
      visibleOptions: top.map((t) => t.opt),
      visibleGroups: null,
      truncated: scored.length > SEARCH_LIMIT,
    };
  }, [search, options, groups, allOptions.length]);

  const renderItem = (option: ComboboxOption) => (
    <CommandItem
      key={option.value}
      value={`${option.label} ${option.hint ?? ""} ${option.badge ?? ""}`}
      onSelect={() => {
        onChange(option.value);
        setOpen(false);
      }}
    >
      <Check
        className={cn(
          "mr-2 h-4 w-4",
          value === option.value ? "opacity-100" : "opacity-0",
        )}
      />
      <span className="flex-1 truncate">{option.label}</span>
      {option.badge && (
        <Badge variant="info" className="ml-2 text-[10px] px-1.5 py-0">
          {option.badge}
        </Badge>
      )}
      {option.hint && (
        <span className="ml-2 text-xs text-muted-foreground">{option.hint}</span>
      )}
    </CommandItem>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between bg-input/50 font-normal"
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            {visibleGroups
              ? visibleGroups.map((g) =>
                  g.options.length > 0 ? (
                    <CommandGroup key={g.heading} heading={g.heading}>
                      {g.options.map(renderItem)}
                    </CommandGroup>
                  ) : null,
                )
              : (
                <CommandGroup>
                  {visibleOptions.map(renderItem)}
                </CommandGroup>
              )}
            {truncated && (
              <div className="px-3 py-1.5 text-xs text-muted-foreground border-t">
                {search
                  ? `Showing top ${SEARCH_LIMIT} matches — refine your search…`
                  : `Showing top ${TOP_DEFAULT} — type to search all ${allOptions.length}`}
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
