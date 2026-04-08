export default function ProductOfferLoading() {
  return (
    <div className="section-shell">
      <div className="grid gap-6">
        <div className="h-8 w-32 rounded-full bg-black/10" />
        <div className="h-14 w-2/3 rounded-full bg-black/10" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.65fr)]">
          <div className="rounded-[2rem] bg-white p-6 shadow-glow">
            <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
              <div className="min-h-[280px] rounded-[1.5rem] bg-black/10" />
              <div className="space-y-4">
                <div className="h-5 w-32 rounded-full bg-black/10" />
                <div className="h-10 w-3/4 rounded-full bg-black/10" />
                <div className="h-4 w-full rounded-full bg-black/10" />
                <div className="h-4 w-5/6 rounded-full bg-black/10" />
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="h-28 rounded-[1.5rem] bg-black/10" />
                  <div className="h-28 rounded-[1.5rem] bg-black/10" />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-black/10 p-6" />
        </div>

        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-[1.5rem] bg-white p-5 shadow-glow">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-3">
                  <div className="h-4 w-40 rounded-full bg-black/10" />
                  <div className="h-8 w-64 rounded-full bg-black/10" />
                  <div className="h-4 w-48 rounded-full bg-black/10" />
                </div>
                <div className="grid gap-3 md:min-w-[220px]">
                  <div className="h-10 w-40 rounded-full bg-black/10" />
                  <div className="h-12 w-full rounded-full bg-black/10" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
