import { Suspense } from "react";
import type { Metadata } from "next";

import { AuthCard } from "@/features/auth";

export const metadata: Metadata = {
  title: "Entrar ou cadastrar",
  description: "Fluxo mock de autenticação isolado dentro da feature auth."
};

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <section className="section-shell">
          <div className="rounded-[2rem] bg-white p-8 shadow-glow">
            <p className="text-sm text-neutral-500">Carregando autenticação...</p>
          </div>
        </section>
      }
    >
      <AuthCard />
    </Suspense>
  );
}
