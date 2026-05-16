"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Dice5, LayoutDashboard, LogIn, LogOut, Plus, UsersRound } from "lucide-react";

import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type HeaderContentProps = {
  className?: string;
  isAuthenticated: boolean;
  logoutAction: () => Promise<void>;
};

function isGamePlayPath(pathname: string): boolean {
  return /^\/games\/[^/]+$/.test(pathname);
}

export function HeaderContent({
  className,
  isAuthenticated,
  logoutAction
}: HeaderContentProps) {
  const pathname = usePathname();

  if (pathname === "/" && !isAuthenticated) {
    return null;
  }

  if (isGamePlayPath(pathname)) {
    return null;
  }

  const feltHeader =
    pathname === "/dashboard" ||
    pathname === "/social" ||
    pathname === "/games/new" ||
    pathname === "/join" ||
    pathname.startsWith("/join/") ||
    pathname === "/login" ||
    pathname === "/register";

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b backdrop-blur-xl",
        feltHeader
          ? "border-white/10 bg-emerald-950/[0.82]"
          : "border-slate-200/70 bg-white/80 dark:border-white/10 dark:bg-zinc-950/75",
        className
      )}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[auto_1fr_auto] sm:px-6">
        <Link
          aria-label="Kniffel Online Startseite"
          className={cn(
            "group inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-semibold outline-none transition-colors",
            feltHeader
              ? "text-white hover:text-amber-100"
              : "text-ink hover:text-felt dark:text-zinc-50 dark:hover:text-emerald-200"
          )}
          href="/"
        >
          <span
            className={cn(
              "grid h-8 w-8 place-items-center rounded-lg border shadow-sm transition-transform group-hover:-rotate-6",
              feltHeader
                ? "border-white/10 bg-white/10 text-amber-50"
                : "border-slate-200 bg-white dark:border-white/10 dark:bg-white/10"
            )}
          >
            <Dice5 aria-hidden="true" className="h-4 w-4" />
          </span>
          <span>Kniffel Online</span>
        </Link>
        {isAuthenticated ? (
          <>
            <nav
              aria-label="Hauptnavigation"
              className="col-span-2 row-start-2 flex flex-wrap items-center gap-1.5 sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:justify-end"
            >
              <Link
                className={cn(
                  buttonVariants("ghost", "sm"),
                  feltHeader ? "text-emerald-50 hover:bg-white/10 hover:text-white" : null
                )}
                href="/dashboard"
              >
                <LayoutDashboard aria-hidden="true" className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                className={cn(
                  buttonVariants("ghost", "sm"),
                  feltHeader ? "text-emerald-50 hover:bg-white/10 hover:text-white" : null
                )}
                href="/social"
              >
                <UsersRound aria-hidden="true" className="h-4 w-4" />
                Social
              </Link>
              <Link
                className={cn(
                  buttonVariants("secondary", "sm"),
                  feltHeader ? "border-white/10 bg-white/10 text-white hover:bg-white/15" : null
                )}
                href="/games/new"
              >
                <Plus aria-hidden="true" className="h-4 w-4" />
                Neue Runde
              </Link>
            </nav>
            <div className="col-start-2 row-start-1 justify-self-end sm:col-start-3">
              <form action={logoutAction}>
                <button
                  aria-label="Abmelden"
                  className={cn(
                    buttonVariants("ghost", "sm"),
                    "w-9 px-0 sm:w-auto sm:px-3",
                    feltHeader ? "text-emerald-50 hover:bg-white/10 hover:text-white" : null
                  )}
                  title="Abmelden"
                  type="submit"
                >
                  <LogOut aria-hidden="true" className="h-4 w-4" />
                  <span className="hidden sm:inline">Abmelden</span>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="col-start-2 row-start-1 justify-self-end sm:col-start-3">
            <Link className={buttonVariants("secondary", "sm")} href="/login">
              <LogIn aria-hidden="true" className="h-4 w-4" />
              Login
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
