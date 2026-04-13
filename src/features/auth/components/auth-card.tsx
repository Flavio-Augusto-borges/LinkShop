"use client";

import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { authService } from "@/features/auth/services/auth.service";
import type { DemoAuthAccount, UserRole } from "@/features/auth/types/auth.types";
import { useAuthStore } from "@/stores";

type Mode = "login" | "register";

const roleLabels: Record<UserRole, string> = {
  guest: "Visitante",
  user: "Usuario",
  admin: "Administrador"
};

export function AuthCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useAuthStore((state) => state.session);
  const signIn = useAuthStore((state) => state.signIn);
  const signUp = useAuthStore((state) => state.signUp);
  const signOut = useAuthStore((state) => state.signOut);
  const clearError = useAuthStore((state) => state.clearError);
  const error = useAuthStore((state) => state.error);

  const [demoAccounts, setDemoAccounts] = useState<DemoAuthAccount[]>([]);
  const [mode, setMode] = useState<Mode>("login");
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const nextPath = useMemo(() => searchParams.get("next") || "/conta", [searchParams]);

  useEffect(() => {
    const requestedMode = searchParams.get("mode");
    setMode(requestedMode === "register" ? "register" : "login");
  }, [searchParams]);

  useEffect(() => {
    let active = true;

    async function loadDemoAccounts() {
      const response = await authService.getDemoAccounts();

      if (active && response.ok) {
        setDemoAccounts(response.data);
      }
    }

    void loadDemoAccounts();

    return () => {
      active = false;
    };
  }, []);

  function resolveNextPath(role: "user" | "admin") {
    if (nextPath.startsWith("/admin") && role !== "admin") {
      return "/";
    }

    return nextPath === "/" ? (role === "admin" ? "/admin" : "/conta") : nextPath;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearError();

    startTransition(async () => {
      if (mode === "login") {
        const ok = await signIn({
          email: form.email,
          password: form.password
        });

        if (ok) {
          const currentRole = useAuthStore.getState().session?.user.role === "admin" ? "admin" : "user";
          router.push(resolveNextPath(currentRole));
        }

        return;
      }

      const ok = await signUp({
        name: form.name,
        email: form.email,
        password: form.password
      });

      if (ok) {
        router.push(resolveNextPath("user"));
      }
    });
  }

  if (session) {
    return (
      <section className="section-shell">
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <aside className="rounded-[2rem] bg-gradient-to-br from-ink via-neutral-900 to-lagoon p-6 text-white shadow-glow">
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-white/70">Sessao ativa</p>
            <h1 className="mt-3 font-display text-4xl leading-tight md:text-5xl">Sua conta ja esta autenticada.</h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/75 md:text-base">
              Favoritos e carrinho agora ficam associados a esta identidade, preparados para futura sincronizacao real.
            </p>
          </aside>

          <div className="glass-panel p-6 md:p-8">
            <h2 className="font-display text-3xl">Bem-vindo, {session.user.name}</h2>
            <p className="mt-2 text-sm leading-7 text-neutral-600">
              Sua sessao esta pronta. Voce pode seguir para a conta, favoritos ou carrinho.
            </p>

            <div className="mt-6 grid gap-3 text-sm text-neutral-600">
              <span>Email: {session.user.email}</span>
              <span>Perfil: {roleLabels[session.user.role]}</span>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/conta"
                className="inline-flex items-center justify-center rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                Ir para minha conta
              </Link>
              <Link
                href="/favoritos"
                className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                Ver favoritos
              </Link>
              <button
                type="button"
                onClick={() => void signOut()}
                className="inline-flex items-center justify-center rounded-full bg-black/5 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-black/10"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section-shell">
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <aside className="rounded-[2rem] bg-gradient-to-br from-ink via-neutral-900 to-lagoon p-6 text-white shadow-glow">
          <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-white/70">Conta de usuario</p>
          <h1 className="mt-3 font-display text-4xl leading-tight md:text-5xl">
            Entre agora e leve seus dados de visitante com voce.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/75 md:text-base">
            Favoritos e carrinho salvos como visitante sao mesclados com sua conta autenticada sem perder dados nem duplicar produtos.
          </p>

          <div className="mt-8 grid gap-3">
            {demoAccounts.map((user) => (
              <article key={user.id} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <strong className="font-display text-lg">{roleLabels[user.role]}</strong>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]">
                    mock
                  </span>
                </div>
                <p className="mt-3 break-all text-sm text-white/75">{user.email}</p>
                <p className="mt-1 text-sm text-white/60">Senha: {user.password}</p>
              </article>
            ))}
          </div>
        </aside>

        <div className="glass-panel p-6 md:p-8">
          <div className="inline-flex rounded-full bg-black/5 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                clearError();
              }}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === "login" ? "bg-ink text-white" : "text-neutral-600"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                clearError();
              }}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === "register" ? "bg-ink text-white" : "text-neutral-600"
              }`}
            >
              Cadastrar
            </button>
          </div>

          <div className="mt-6">
            <h2 className="font-display text-3xl">
              {mode === "login" ? "Entrar na sua conta" : "Criar conta para sincronizar depois"}
            </h2>
            <p className="mt-2 text-sm leading-7 text-neutral-600">
              {mode === "login"
                ? "Sua conta mock ja respeita a arquitetura de service + store e esta pronta para trocar para auth real."
                : "O cadastro prepara a base para sincronizacao futura por usuario real, sem alterar o fluxo atual."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            {mode === "register" ? (
              <label className="grid gap-2 text-sm text-neutral-600">
                Nome
                <input
                  required
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-coral/40"
                  placeholder="Seu nome"
                />
              </label>
            ) : null}

            <label className="grid gap-2 text-sm text-neutral-600">
              Email
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-coral/40"
                placeholder="voce@email.com"
              />
            </label>

            <label className="grid gap-2 text-sm text-neutral-600">
              Senha
              <input
                required
                type="password"
                minLength={6}
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-coral/40"
                placeholder="Minimo de 6 caracteres"
              />
            </label>

            {error ? (
              <div className="rounded-2xl border border-coral/20 bg-coral/10 px-4 py-3 text-sm text-coral">
                {error}
              </div>
            ) : null}

            <div className="rounded-[1.5rem] bg-black/5 p-4 text-sm text-neutral-600">
              Regra de transicao: favoritos sao unidos por produto, e o carrinho e unificado por produto sem duplicar itens. Em conflito, mantemos a maior quantidade e os detalhes mais recentes.
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center justify-center rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-70"
              >
                {isPending ? "Processando..." : mode === "login" ? "Entrar" : "Cadastrar"}
              </button>

              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full bg-black/5 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-black/10"
              >
                Voltar para a home
              </Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
