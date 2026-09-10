import Link from "next/link";

export default function ProductNotFound() {
  return <main className="grid min-h-screen place-items-center p-6"><div className="max-w-md text-center"><p className="text-sm font-semibold uppercase tracking-[.16em] text-muted-foreground">404</p><h1 className="mt-3 text-3xl font-semibold">Product not found</h1><p className="mt-3 text-sm text-muted-foreground">This item may no longer be available.</p><Link className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" href="/shop">Browse the collection</Link></div></main>;
}
