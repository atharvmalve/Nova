"use client";

export default function StorefrontError({ reset }: { reset: () => void }) {
  return <main className="grid min-h-screen place-items-center p-6"><div className="max-w-md text-center"><h1 className="text-2xl font-semibold">We couldn’t load the store</h1><p className="mt-3 text-sm text-muted-foreground">Please try again in a moment.</p><button className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" onClick={reset} type="button">Try again</button></div></main>;
}
