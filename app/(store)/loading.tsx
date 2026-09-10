export default function StorefrontLoading() {
  return <main className="min-h-screen animate-pulse bg-background"><div className="h-16 border-b" /><div className="mx-auto max-w-7xl px-5 py-20 sm:px-8"><div className="h-10 w-2/3 rounded bg-muted" /><div className="mt-5 h-6 w-1/2 rounded bg-muted" /><div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div className="aspect-[4/5] rounded-xl bg-muted" key={index} />)}</div></div></main>;
}
