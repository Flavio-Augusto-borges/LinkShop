"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuthStore, useCartStore, useFavoritesStore } from "@/stores";
import { getPreferenceOwnerId } from "@/shared/lib/identity";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const signOut = useAuthStore((state) => state.signOut);
  const favorites = useFavoritesStore((state) => state.favorites);
  const carts = useCartStore((state) => state.carts);

  const role = session?.user.role ?? "guest";
  const isAdmin = role === "admin";
  const ownerId = useMemo(() => getPreferenceOwnerId(session), [session]);
  const favoritesCount = favorites.filter((favorite) => favorite.userId === ownerId).length;
  const cart = carts.find((entry) => entry.ownerId === ownerId);
  const [searchQuery, setSearchQuery] = useState("");
  const [isHiddenOnScroll, setIsHiddenOnScroll] = useState(false);
  const lastScrollYRef = useRef(0);
  const isHiddenRef = useRef(false);
  const downTravelRef = useRef(0);
  const upTravelRef = useRef(0);
  const hasHiddenSinceTopRef = useRef(false);
  const frameRef = useRef<number | null>(null);

  const TOP_STICKY_ZONE = 72;
  const INITIAL_HIDE_THRESHOLD = 28;
  const FREE_HIDE_THRESHOLD = 10;
  const FREE_SHOW_THRESHOLD = 6;
  const NOISE_THRESHOLD = 1.5;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (pathname === "/buscar") {
      const queryFromUrl = new URLSearchParams(window.location.search).get("q") ?? "";
      setSearchQuery(queryFromUrl);
    } else {
      setSearchQuery("");
    }
  }, [pathname]);

  useEffect(() => {
    setIsHiddenOnScroll(false);
    isHiddenRef.current = false;
    downTravelRef.current = 0;
    upTravelRef.current = 0;
    hasHiddenSinceTopRef.current = false;
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    lastScrollYRef.current = window.scrollY;
    setIsHiddenOnScroll(false);
    isHiddenRef.current = false;
    downTravelRef.current = 0;
    upTravelRef.current = 0;
    hasHiddenSinceTopRef.current = false;

    function handleScroll() {
      if (frameRef.current !== null) {
        return;
      }

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;

        const currentY = window.scrollY;
        const delta = currentY - lastScrollYRef.current;

        if (Math.abs(delta) < NOISE_THRESHOLD) {
          return;
        }

        if (currentY <= TOP_STICKY_ZONE) {
          downTravelRef.current = 0;
          upTravelRef.current = 0;
          hasHiddenSinceTopRef.current = false;
          if (isHiddenRef.current) {
            isHiddenRef.current = false;
            setIsHiddenOnScroll(false);
          }
          lastScrollYRef.current = currentY;
          return;
        }

        if (delta > 0) {
          downTravelRef.current += delta;
          upTravelRef.current = 0;

          const hideThreshold = hasHiddenSinceTopRef.current ? FREE_HIDE_THRESHOLD : INITIAL_HIDE_THRESHOLD;
          if (!isHiddenRef.current && downTravelRef.current >= hideThreshold) {
            isHiddenRef.current = true;
            setIsHiddenOnScroll(true);
            hasHiddenSinceTopRef.current = true;
            downTravelRef.current = 0;
          }
        } else {
          upTravelRef.current += Math.abs(delta);
          downTravelRef.current = 0;

          if (isHiddenRef.current && upTravelRef.current >= FREE_SHOW_THRESHOLD) {
            isHiddenRef.current = false;
            setIsHiddenOnScroll(false);
            upTravelRef.current = 0;
          }
        }

        lastScrollYRef.current = currentY;
      });
    }

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, []);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextQuery = searchQuery.trim();
    const nextParams = new URLSearchParams();

    if (nextQuery) {
      nextParams.set("q", nextQuery);
    }

    router.push(`/buscar${nextParams.toString() ? `?${nextParams.toString()}` : ""}`);
  }

  function navItemClass(href: string) {
    const isActive = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

    return `rounded-full px-3 py-1.5 text-sm transition ${
      isActive ? "bg-black/10 text-ink" : "text-neutral-600 hover:bg-black/5"
    }`;
  }

  return (
    <header
      className={`glass-panel sticky top-2 z-30 px-3 py-3 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform md:px-5 md:py-4 ${
        isHiddenOnScroll ? "-translate-y-[115%] opacity-95" : "translate-y-0 opacity-100"
      }`}
    >
      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-coral to-orange-400 font-display text-xs font-bold tracking-[0.16em] text-white md:h-10 md:w-10">
              LS
            </span>
            <div>
              <strong className="block font-display text-sm md:text-base">LinkShop</strong>
              <span className="hidden text-xs text-neutral-500 md:block">Comparador de precos e ofertas</span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {isAdmin ? (
              <Link
                href="/admin"
                className="rounded-full bg-black/5 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-black/10"
              >
                Admin
              </Link>
            ) : null}

            {session ? (
              <>
                <Link href="/conta" className="rounded-full bg-black/5 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-black/10">
                  Conta
                </Link>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="rounded-full bg-black/5 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-black/10"
                >
                  Sair
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className="rounded-full bg-coral px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600"
              >
                Entrar / Cadastrar
              </Link>
            )}
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar produto, marca ou categoria"
            className="min-w-0 flex-1 rounded-full border border-black/10 bg-white px-4 py-2 text-sm outline-none transition focus:border-coral/40"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-coral px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            Buscar
          </button>
        </form>

        <nav className="flex flex-wrap items-center gap-1.5 text-sm text-neutral-600">
          <Link href="/" className={navItemClass("/")}>
            Inicio
          </Link>
          <Link href="/buscar" className={navItemClass("/buscar")}>
            Buscar
          </Link>
          <Link href="/favoritos" className={navItemClass("/favoritos")}>
            Favoritos ({favoritesCount})
          </Link>
          <Link href="/lista" className={navItemClass("/lista")}>
            Carrinho ({cart?.totalItems ?? 0})
          </Link>
        </nav>
      </div>
    </header>
  );
}
