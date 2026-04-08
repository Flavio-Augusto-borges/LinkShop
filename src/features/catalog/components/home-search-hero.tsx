"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { SearchBar } from "@/features/catalog/components/search-bar";

type HomeSearchHeroProps = {
  initialQuery?: string;
};

export function HomeSearchHero({ initialQuery = "" }: HomeSearchHeroProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  function handleSearch() {
    const params = new URLSearchParams();

    if (query.trim()) {
      params.set("q", query.trim());
    }

    router.push(`/buscar${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <section className="glass-panel mt-6 overflow-hidden p-6 md:p-8">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-coral">Compare antes de comprar</p>
          <h1 className="mt-3 max-w-[12ch] font-display text-5xl leading-none md:text-7xl">
            Encontre o melhor preco em diferentes lojas.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-neutral-600">
            Pesquise produtos, compare ofertas entre marketplaces e descubra rapidamente qual loja esta vendendo melhor.
          </p>

          <form
            className="mt-8"
            onSubmit={(event) => {
              event.preventDefault();
              handleSearch();
            }}
          >
            <SearchBar
              value={query}
              onChange={setQuery}
              onSubmit={handleSearch}
              placeholder="Ex.: iPhone 15, Galaxy S24, Air Fryer"
            />
            <button
              type="submit"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              Buscar ofertas
            </button>
          </form>
        </div>

        <div className="rounded-[2rem] bg-gradient-to-br from-ink via-neutral-900 to-lagoon p-6 text-white shadow-glow">
          <h2 className="font-display text-3xl leading-tight">O fluxo principal ja nasce pronto para escalar.</h2>
          <ul className="mt-5 grid gap-3 text-sm text-white/75">
            <li>Busca central para descoberta rapida</li>
            <li>Listagem com filtros e ordenacao</li>
            <li>Pagina de produto com comparacao entre ofertas</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
