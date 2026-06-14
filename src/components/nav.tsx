"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

// The front door is the Summary (home). Everything else is reachable but
// tucked behind one quiet menu so a first-time reader isn't met with a wall
// of tabs.
const deepDives = [
  { href: "/overview", label: "Weekly scorecard", hint: "The live dashboard" },
  { href: "/categories", label: "Categories", hint: "Share of voice vs competitors" },
  { href: "/prompts", label: "Prompt Panel", hint: "The measurement unit, with CIs" },
  { href: "/trust", label: "Answer Trust", hint: "Is the answer true?" },
  { href: "/outcomes", label: "Outcomes", hint: "What is it worth?" },
  { href: "/experiments", label: "Experiments", hint: "Treated vs control" },
  { href: "/methodology", label: "Methodology", hint: "The framework and its limits" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the menu whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const onHome = pathname === "/";
  const inDeep = deepDives.some((d) => pathname.startsWith(d.href));

  return (
    <header className="sticky top-0 z-20 border-b border-border-subtle bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-sm font-black text-white">A</span>
          <span className="text-sm font-bold tracking-tight">
            AI Search Visibility Scorecard
            <span className="ml-2 hidden font-normal text-muted sm:inline">Growth Marketing</span>
          </span>
        </Link>

        <nav className="ml-auto flex items-center gap-1">
          <Link
            href="/"
            className={clsx(
              "whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm",
              onHome ? "bg-accent-soft font-semibold text-accent" : "text-foreground/70 hover:bg-zinc-100 hover:text-foreground",
            )}
          >
            Summary
          </Link>

          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={open}
              className={clsx(
                "flex items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm",
                inDeep ? "bg-accent-soft font-semibold text-accent" : "text-foreground/70 hover:bg-zinc-100 hover:text-foreground",
              )}
            >
              Deep dives
              <span className={clsx("text-[10px] transition-transform", open && "rotate-180")} aria-hidden>
                ▾
              </span>
            </button>
            {open ? (
              <div
                role="menu"
                className="absolute right-0 top-full mt-1.5 w-64 overflow-hidden rounded-lg border border-border-subtle bg-white py-1 shadow-lg"
              >
                {deepDives.map((it) => {
                  const active = pathname.startsWith(it.href);
                  return (
                    <Link
                      key={it.href}
                      href={it.href}
                      role="menuitem"
                      className={clsx(
                        "block px-3 py-2",
                        active ? "bg-accent-soft" : "hover:bg-zinc-100",
                      )}
                    >
                      <span className={clsx("block text-sm", active ? "font-semibold text-accent" : "text-foreground/85")}>
                        {it.label}
                      </span>
                      <span className="block text-[11px] text-muted">{it.hint}</span>
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        </nav>

        <span className="hidden shrink-0 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 md:inline">
          Demo · simulated data
        </span>
      </div>
    </header>
  );
}
