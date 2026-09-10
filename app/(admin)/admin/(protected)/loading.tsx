export default function AdminLoading() {
  return <main className="mx-auto max-w-7xl animate-pulse p-5 sm:p-8"><div className="h-4 w-24 rounded bg-muted" /><div className="mt-3 h-9 w-48 rounded bg-muted" /><div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div className="h-32 rounded-xl bg-muted" key={index} />)}</div><div className="mt-8 h-80 rounded-xl bg-muted" /></main>;
}
