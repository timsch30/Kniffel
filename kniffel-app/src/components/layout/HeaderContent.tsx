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

  if (isGamePlayPath(pathname)) {
    return null;
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/75",
        className
      )}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          aria-label="Kniffel Online Startseite"
          className="group inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-semibold text-ink outline-none transition-colors hover:text-felt dark:text-zinc-50 dark:hover:text-emerald-200"
          href="/"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white shadow-sm transition-transform group-hover:-rotate-6 dark:border-white/10 dark:bg-white/10">
            <Dice5 aria-hidden="true" className="h-4 w-4" />
          </span>
          <span>Kniffel Online</span>
        </Link>
        <nav aria-label="Hauptnavigation" className="flex flex-wrap items-center gap-1.5">
          {isAuthenticated ? (
            <>
              <Link className={buttonVariants("ghost", "sm")} href="/dashboard">
                <LayoutDashboard aria-hidden="true" className="h-4 w-4" />
                Dashboard
              </Link>
              <Link className={buttonVariants("ghost", "sm")} href="/social">
                <UsersRound aria-hidden="true" className="h-4 w-4" />
                Social
              </Link>
              <Link className={buttonVariants("secondary", "sm")} href="/games/new">
                <Plus aria-hidden="true" className="h-4 w-4" />
                Neue Runde
              </Link>
              <form action={logoutAction}>
                <button className={buttonVariants("ghost", "sm")} type="submit">
                  <LogOut aria-hidden="true" className="h-4 w-4" />
                  Abmelden
                </button>
              </form>
            </>
          ) : (
            <Link className={buttonVariants("secondary", "sm")} href="/login">
              <LogIn aria-hidden="true" className="h-4 w-4" />
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
