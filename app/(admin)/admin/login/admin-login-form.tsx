"use client";

import { useActionState } from "react";

import { signInAdmin, type AdminLoginState } from "./actions";

const initialState: AdminLoginState = {};

export function AdminLoginForm({ next }: { next?: string }) {
  const [state, formAction, isPending] = useActionState(signInAdmin, initialState);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="email">Email</label>
        <input
          autoComplete="email"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          id="email"
          name="email"
          required
          type="email"
        />
        {state.fieldErrors?.email?.map((error) => <p className="text-sm text-destructive" key={error}>{error}</p>)}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="password">Password</label>
        <input
          autoComplete="current-password"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          id="password"
          name="password"
          required
          type="password"
        />
        {state.fieldErrors?.password?.map((error) => <p className="text-sm text-destructive" key={error}>{error}</p>)}
      </div>
      {state.error ? <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">{state.error}</p> : null}
      <button className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50" disabled={isPending} type="submit">
        {isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
