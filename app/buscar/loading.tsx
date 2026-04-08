export default function SearchLoading() {
  return (
    <div className="section-shell">
      <div className="glass-panel mt-6 p-6 md:p-8">
        <div className="grid gap-4">
          <div className="h-4 w-40 rounded-full bg-black/10" />
          <div className="h-14 w-full rounded-2xl bg-black/10" />
          <div className="h-12 w-40 rounded-full bg-black/10" />
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="rounded-[1.75rem] bg-white p-5 shadow-glow">
          <div className="space-y-4">
            <div className="h-8 w-24 rounded-full bg-black/10" />
            <div className="h-12 rounded-2xl bg-black/10" />
            <div className="h-12 rounded-2xl bg-black/10" />
            <div className="h-12 rounded-2xl bg-black/10" />
            <div className="h-12 rounded-full bg-black/10" />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-[1.75rem] bg-white shadow-glow">
              <div className="aspect-[1/0.82] bg-black/10" />
              <div className="grid gap-4 p-5">
                <div className="h-4 w-32 rounded-full bg-black/10" />
                <div className="h-8 w-3/4 rounded-full bg-black/10" />
                <div className="h-4 w-full rounded-full bg-black/10" />
                <div className="h-4 w-2/3 rounded-full bg-black/10" />
                <div className="h-10 w-1/2 rounded-full bg-black/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
