"use client";

import Link from "next/link";
import { useMemo } from "react";

import { AccountPriceWatchList } from "@/features/price-alerts";
import { useAuthStore, useCartStore, useFavoritesStore } from "@/stores";
import { usePriceWatchStore } from "@/stores";
import { getPreferenceOwnerId } from "@/shared/lib/identity";
import { SectionHeading } from "@/shared/ui/section-heading";

export function AccountPageView() {
  const session = useAuthStore((state) => state.session);
  const signOut = useAuthStore((state) => state.signOut);
  const favorites = useFavoritesStore((state) => state.favorites);
  const carts = useCartStore((state) => state.carts);
  const watches = usePriceWatchStore((state) => state.watches);
  const ownerId = useMemo(() => getPreferenceOwnerId(session), [session]);
  const userFavoritesCount = favorites.filter((favorite) => favorite.userId === ownerId).length;
  const userCart = carts.find((cart) => cart.ownerId === ownerId);
  const userWatchCount = watches.filter((watch) => watch.ownerId === ownerId && watch.isActive).length;

  if (!session) {
    return (
      <section className="section-shell">
        <div className="rounded-[2rem] bg-white p-8 shadow-glow">
          <h1 className="font-display text-4xl">Entre para acessar sua conta.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-600">
            Sua area de conta centraliza favoritos, carrinho e o futuro historico sincronizado por usuario.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/auth?next=/conta"
              className="inline-flex items-center justify-center rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              Entrar
            </Link>
            <Link
              href="/buscar"
              className="inline-flex items-center justify-center rounded-full bg-black/5 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-black/10"
            >
              Explorar catalogo
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section-shell">
      <SectionHeading
        eyebrow="Minha conta"
        title={`Bem-vindo, ${session.user.name}`}
        description="Sua base pessoal de acompanhamento esta pronta para evoluir para sincronizacao real com backend."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.65fr)]">
        <article className="rounded-[2rem] bg-white p-6 shadow-glow">
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-black/5 px-3 py-1 text-neutral-700">{session.user.role}</span>
            <span className="rounded-full bg-lagoon/10 px-3 py-1 text-lagoon">Conta mock pronta para evolucao</span>
          </div>

          <div className="mt-6 grid gap-3 text-sm text-neutral-600">
            <span>Nome: {session.user.name}</span>
            <span>Email: {session.user.email}</span>
            <span>Criado em: {new Date(session.user.createdAt).toLocaleDateString("pt-BR")}</span>
            <span>Sessao expira em: {new Date(session.expiresAt).toLocaleDateString("pt-BR")}</span>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/favoritos"
              className="inline-flex items-center justify-center rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              Ver favoritos
            </Link>
            <Link
              href="/lista"
              className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Ver carrinho
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex items-center justify-center rounded-full bg-black/5 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-black/10"
            >
              Sair
            </button>
          </div>
        </article>

        <aside className="grid gap-4">
          <div className="rounded-[1.75rem] bg-white p-5 shadow-glow">
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-coral">Resumo</p>
            <div className="mt-4 grid gap-3 text-sm text-neutral-600">
              <span>{userFavoritesCount} produtos nos favoritos</span>
              <span>{userCart?.totalItems ?? 0} itens no carrinho</span>
              <span>{userWatchCount} produtos com acompanhamento ativo</span>
              <span>Total estimado atual: {(userCart?.subtotal ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
            </div>
          </div>

          <AccountPriceWatchList />

          <div className="rounded-[1.75rem] bg-gradient-to-br from-ink via-neutral-900 to-lagoon p-5 text-white shadow-glow">
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-white/70">Proxima etapa</p>
            <p className="mt-3 text-sm leading-7 text-white/75">
              Quando o backend real entrar, esta area podera sincronizar favoritos, carrinho, produtos acompanhados e historico da conta por usuario autenticado.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
