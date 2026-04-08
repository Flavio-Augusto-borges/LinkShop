import Link from "next/link";

type CatalogPaginationProps = {
  currentPage: number;
  totalPages: number;
  buildPageHref: (page: number) => string;
};

function getVisiblePages(currentPage: number, totalPages: number) {
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  const pages: number[] = [];

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  return pages;
}

export function CatalogPagination({ currentPage, totalPages, buildPageHref }: CatalogPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = getVisiblePages(currentPage, totalPages);

  return (
    <nav aria-label="Paginacao de resultados" className="mt-8 flex flex-col gap-4 rounded-[1.75rem] bg-white p-5 shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-neutral-500">
        <span>
          Pagina {currentPage} de {totalPages}
        </span>
        <span>Navegue entre os resultados para comparar mais ofertas.</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={buildPageHref(Math.max(1, currentPage - 1))}
          aria-disabled={currentPage === 1}
          className={`inline-flex min-w-24 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition ${
            currentPage === 1 ? "cursor-not-allowed bg-black/5 text-neutral-400" : "bg-ink text-white hover:bg-neutral-800"
          }`}
        >
          Anterior
        </Link>

        {pages.map((page) => (
          <Link
            key={page}
            href={buildPageHref(page)}
            aria-current={page === currentPage ? "page" : undefined}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold transition ${
              page === currentPage ? "bg-coral text-white" : "bg-black/5 text-neutral-700 hover:bg-black/10"
            }`}
          >
            {page}
          </Link>
        ))}

        <Link
          href={buildPageHref(Math.min(totalPages, currentPage + 1))}
          aria-disabled={currentPage === totalPages}
          className={`inline-flex min-w-24 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition ${
            currentPage === totalPages
              ? "cursor-not-allowed bg-black/5 text-neutral-400"
              : "bg-coral text-white hover:bg-orange-600"
          }`}
        >
          Proxima
        </Link>
      </div>
    </nav>
  );
}
