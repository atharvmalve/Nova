"use client";

import Link from "next/link";
import { Boxes, LayoutDashboard, LogOut, Settings, ShoppingBag, Users } from "lucide-react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { storeConfig } from "@/src/config/store";

const navigation = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard }, { href: "/admin/products", label: "Products", icon: Boxes },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag }, { href: "/admin/customers", label: "Customers", icon: Users }, { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar({ email, role, signOut }: { email: string; role: string; signOut: () => void }) {
  const pathname = usePathname();
  return <aside className="border-b bg-background lg:fixed lg:inset-y-0 lg:w-64 lg:border-b-0 lg:border-r"><div className="flex h-16 items-center justify-between px-5 lg:h-20"><Link className="flex items-center gap-2 font-bold tracking-tight" href="/admin"><span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">{storeConfig.name.slice(0, 1).toUpperCase()}</span>{storeConfig.name} Admin</Link></div><nav aria-label="Admin navigation" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:grid lg:px-3"><div className="contents lg:space-y-1">{navigation.map(({ href, icon: Icon, label }) => { const active = href === "/admin" ? pathname === href : pathname.startsWith(href); return <Link className={`flex shrink-0 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`} href={href} key={href}><Icon className="size-4" />{label}</Link>; })}</div></nav><div className="hidden border-t p-4 lg:block"><p className="truncate text-sm font-medium">{email}</p><p className="mt-1 text-xs capitalize text-muted-foreground">{role}</p><form action={signOut}><Button className="mt-4 w-full justify-start" variant="outline"><LogOut />Sign out</Button></form></div></aside>;
}
