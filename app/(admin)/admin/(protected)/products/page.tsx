import { AlertCircle, PackagePlus } from "lucide-react";
import { ProductManager } from "@/components/admin/product-manager";
import { getAdminCategories, getAdminProducts } from "@/services/admin-products";

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const get = (key: string) => typeof params[key] === "string" ? params[key] : "";
  const page = Number(get("page")) || 1;
  const [products, categories] = await Promise.all([getAdminProducts({ q: get("q").slice(0, 100), status: get("status"), categoryId: get("category"), page }), getAdminCategories()]);
  return <main className="mx-auto max-w-7xl p-5 sm:p-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-muted-foreground">Catalog</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Products</h1><p className="mt-2 text-sm text-muted-foreground">Manage your catalog, availability, and inventory.</p></div><PackagePlus className="size-8 text-muted-foreground" /></div>{products.error ? <div className="mt-6 flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"><AlertCircle className="size-5 shrink-0" />{products.error}</div> : <ProductManager categories={categories} initialFilters={{ q: get("q"), status: get("status"), category: get("category") }} products={products.data} />}</main>;
}
