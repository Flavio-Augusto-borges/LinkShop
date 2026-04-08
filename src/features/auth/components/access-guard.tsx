"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import type { UserRole } from "@/features/auth/types/auth.types";
import { useAuthStore } from "@/stores";

type AccessGuardProps = {
  allowedRoles: UserRole[];
  title: string;
  description: string;
  children: ReactNode;
};

export function AccessGuard({ allowedRoles, title, description, children }: AccessGuardProps) {
  const status = useAuthStore((state) => state.status);
  const role = useAuthStore((state) => state.session?.user.role ?? "guest");

  if (status === "idle" || status === "loading") {
    return (
      <section className="section-shell">
        <div className="rounded-[1.75rem] bg-white p-8 shadow-glow">
          <p className="text-sm text-neutral-500">Carregando sessão...</p>
        </div>
      </section>
    );
  }

  if (allowedRoles.includes(role)) {
    return <>{children}</>;
  }

  return (
    <section className="section-shell">
      <div className="rounded-[2rem] bg-gradient-to-br from-ink via-neutral-900 to-lagoon p-8 text-white shadow-glow">
        <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-white/70">Acesso restrito</p>
        <h1 className="mt-3 font-display text-4xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75 md:text-base">{description}</p>
        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <Link
            href="/auth?next=/admin"
            className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink"
          >
            Entrar
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-white/10 px-5 py-3 text-sm font-semibold text-white"
          >
            Voltar ao catálogo
          </Link>
        </div>
      </div>
    </section>
  );
}
