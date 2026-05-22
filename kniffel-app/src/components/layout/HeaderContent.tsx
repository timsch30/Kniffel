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

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b backdrop-blur-xl",
        "border-white/10 bg-emerald-950/[0.82]",
        className
      )}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[auto_1fr_auto] sm:px-6">
        <Link
          aria-label="Kniffel Online Startseite"
          className={cn(
            "group inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-semibold outline-none transition-colors",
            "text-white hover:text-amber-100"
          )}
          href="/"
        >
          <span
            className={cn(
              "grid h-8 w-8 place-items-center rounded-lg border shadow-sm transition-transform group-hover:-rotate-6",
              "border-white/10 bg-white/10 text-amber-50"
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
                className={buttonVariants("ghost", "sm")}
                href="/dashboard"
              >
                <LayoutDashboard aria-hidden="true" className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                className={buttonVariants("ghost", "sm")}
                href="/social"
              >
                <UsersRound aria-hidden="true" className="h-4 w-4" />
                Social
              </Link>
              <Link
                className={buttonVariants("secondary", "sm")}
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
                    "w-9 px-0 sm:w-auto sm:px-3"
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
