import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section-shell text-center">
      <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-coral">Página não encontrada</p>
      <h1 className="mt-3 font-display text-4xl">Não encontramos esta oferta.</h1>
      <p className="mx-auto mt-4 max-w-xl text-neutral-600">
        Volte para a home para continuar explorando produtos, promoções e vitrines do shopping digital.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
      >
        Voltar ao catálogo
      </Link>
    </section>
  );
}
