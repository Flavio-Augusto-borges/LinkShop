type HomeSearchHeroProps = {
  initialQuery?: string;
};

export function HomeSearchHero({ initialQuery = "" }: HomeSearchHeroProps) {
  const normalizedQuery = initialQuery.trim();
  const hasQueryContext = normalizedQuery.length > 0;

  return (
    <section className="glass-panel mt-6 overflow-hidden p-5 md:p-6">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-coral">Comparacao objetiva</p>
          <h1 className="mt-2 max-w-[16ch] font-display text-3xl leading-tight md:text-4xl">
            Compare ofertas com menos cliques e mais contexto.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600 md:text-base">
            A busca principal agora fica no cabecalho. Use os atalhos da home para alternar entre secoes e explorar o
            catalogo sem rolagem excessiva.
          </p>
          {hasQueryContext ? (
            <p className="mt-3 rounded-full bg-black/5 px-4 py-2 text-sm text-neutral-600">
              Contexto atual da busca: <strong className="font-semibold text-ink">{normalizedQuery}</strong>
            </p>
          ) : null}
        </div>

        <div className="rounded-[1.5rem] bg-gradient-to-br from-ink via-neutral-900 to-lagoon p-5 text-white shadow-glow">
          <h2 className="font-display text-2xl leading-tight">Fluxo principal pronto para decidir compra.</h2>
          <div className="mt-4 grid gap-2 text-sm text-white/75">
            <span>1. Buscar no cabecalho</span>
            <span>2. Refinar filtros na listagem</span>
            <span>3. Comparar ofertas na pagina de produto</span>
          </div>
        </div>
      </div>
    </section>
  );
}
