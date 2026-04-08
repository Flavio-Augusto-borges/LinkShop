"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";

import { useAuthStore, useCartStore, useFavoritesStore } from "@/stores";
import { getPreferenceOwnerId } from "@/shared/lib/identity";

const roleLabels = {
  guest: "Visitante",
  user: "Usuario",
  admin: "Administrador"
} as const;

export function SiteHeader() {
  const pathname = usePathname();
  const session = useAuthStore((state) => state.session);
  const signOut = useAuthStore((state) => state.signOut);
  const favorites = useFavoritesStore((state) => state.favorites);
  const carts = useCartStore((state) => state.carts);
  const role = session?.user.role ?? "guest";
  const isAdmin = role === "admin";
  const ownerId = useMemo(() => getPreferenceOwnerId(session), [session]);
  const favoritesCount = favorites.filter((favorite) => favorite.userId === ownerId).length;
  const cart = carts.find((entry) => entry.ownerId === ownerId);

  return (
    <header className="glass-panel sticky top-4 z-30 flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
      <Link href="/" className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-coral to-orange-400 font-display text-sm font-bold tracking-[0.2em] text-white">
          LS
        </span>
        <div>
          <strong className="block font-display text-base">LinkShop</strong>
          <span className="text-sm text-neutral-500">Comparador de precos e ofertas</span>
        </div>
      </Link>

      <nav className="flex flex-wrap items-center gap-4 text-sm text-neutral-600">
        <Link href="/">Inicio</Link>
        <Link href="/buscar">Catalogo</Link>
        <Link href="/favoritos">Favoritos ({favoritesCount})</Link>
        <Link href="/lista">Sua lista ({cart?.totalItems ?? 0})</Link>
        {session ? <Link href="/conta">Minha conta</Link> : null}
        {isAdmin ? <Link href="/admin">Admin</Link> : null}
        {!session ? <Link href="/auth">Entrar</Link> : null}
      </nav>

      <div className="flex flex-col gap-3 md:items-end">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-black/5 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-neutral-700">
            {roleLabels[role]}
          </span>
          {session ? (
            <span className="max-w-[14rem] truncate text-sm text-neutral-500">{session.user.email}</span>
          ) : (
            <span className="text-sm text-neutral-500">Navegando sem login</span>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {session ? (
            <Link
              href="/conta"
              className="inline-flex items-center justify-center rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              Minha conta
            </Link>
          ) : null}

          {isAdmin ? (
            <Link
              href="/admin"
              className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Gerenciar catalogo
            </Link>
          ) : null}

          {!session && pathname !== "/auth" ? (
            <Link
              href="/auth?next=/conta"
              className="inline-flex items-center justify-center rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              Entrar ou cadastrar
            </Link>
          ) : null}

          {session ? (
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex items-center justify-center rounded-full bg-black/5 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-black/10"
            >
              Sair
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
