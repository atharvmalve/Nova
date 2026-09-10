import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ProductInput } from "@/lib/validation/products";

export type AdminProduct = { id: string; title: string; description: string | null; pricePaise: number; compareAtPricePaise: number | null; sku: string | null; inventoryQuantity: number; categoryId: string | null; categoryName: string | null; status: "draft" | "active" | "archived"; createdAt: string; imageUrl: string | null; imagePath: string | null; };
export type AdminCategory = { id: string; name: string };
export type AdminProductPage = { items: AdminProduct[]; total: number; page: number; totalPages: number; };
type ProductDbRow = { id: string; title: string; description: string | null; price_paise: number; compare_at_price_paise: number | null; sku: string | null; inventory_quantity: number; category_id: string | null; status: "draft" | "active" | "archived"; created_at: string; categories: { name: string } | null; product_images: { storage_path: string; sort_order: number }[] | null; };

const PER_PAGE = 20;
const imageBucket = "product-images";

function mapProduct(row: ProductDbRow, imageUrl: string | null): AdminProduct { return { id: row.id, title: row.title, description: row.description, pricePaise: Number(row.price_paise), compareAtPricePaise: row.compare_at_price_paise === null ? null : Number(row.compare_at_price_paise), sku: row.sku, inventoryQuantity: row.inventory_quantity, categoryId: row.category_id, categoryName: row.categories?.name ?? null, status: row.status, createdAt: row.created_at, imageUrl, imagePath: row.product_images?.[0]?.storage_path ?? null }; }

export async function getAdminProducts({ q = "", status = "all", categoryId = "", page = 1 }: { q?: string; status?: string; categoryId?: string; page?: number }): Promise<{ data: AdminProductPage; error: string | null }> {
  const safePage = Math.max(1, Math.min(page, 10_000));
  try {
    const supabase = await createServerSupabaseClient();
    let query = supabase.from("products").select("id,title,description,price_paise,compare_at_price_paise,sku,inventory_quantity,category_id,status,created_at,categories(name),product_images(storage_path,sort_order)", { count: "exact" });
    if (q) query = query.or(`title.ilike.%${q.replace(/[%_,()]/g, "")}%,sku.ilike.%${q.replace(/[%_,()]/g, "")}%`);
    if (["draft", "active", "archived"].includes(status)) query = query.eq("status", status);
    if (categoryId) query = query.eq("category_id", categoryId);
    const { data, error, count } = await query.order("created_at", { ascending: false }).order("sort_order", { referencedTable: "product_images", ascending: true }).range((safePage - 1) * PER_PAGE, safePage * PER_PAGE - 1);
    if (error) throw error;
    const rows = (data ?? []) as unknown as ProductDbRow[];
    const items = await Promise.all(rows.map(async (row) => { const path = row.product_images?.[0]?.storage_path; const signed = path ? await supabase.storage.from(imageBucket).createSignedUrl(path, 3600) : { data: null }; return mapProduct(row, signed.data?.signedUrl ?? null); }));
    const total = count ?? 0;
    return { data: { items, total, page: safePage, totalPages: Math.ceil(total / PER_PAGE) }, error: null };
  } catch { return { data: { items: [], total: 0, page: safePage, totalPages: 0 }, error: "Unable to load products. Please try again." }; }
}

export async function getAdminCategories(): Promise<AdminCategory[]> { const supabase = await createServerSupabaseClient(); const { data } = await supabase.from("categories").select("id,name").order("name"); return (data ?? []) as AdminCategory[]; }

function slugFor(title: string) { return `${title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 140) || "product"}-${crypto.randomUUID().slice(0, 8)}`; }
export async function createAdminProduct(input: ProductInput) { const supabase = await createServerSupabaseClient(); const { data, error } = await supabase.from("products").insert({ title: input.title, slug: slugFor(input.title), description: input.description, price_paise: input.price, compare_at_price_paise: input.compareAtPrice, sku: input.sku, inventory_quantity: input.inventoryQuantity, category_id: input.categoryId, status: input.status }).select("id").single(); if (error || !data) throw new Error(error?.code === "23505" ? "That SKU is already in use." : "Unable to create the product."); return data.id; }
export async function updateAdminProduct(id: string, input: ProductInput) { const supabase = await createServerSupabaseClient(); const { error } = await supabase.from("products").update({ title: input.title, description: input.description, price_paise: input.price, compare_at_price_paise: input.compareAtPrice, sku: input.sku, inventory_quantity: input.inventoryQuantity, category_id: input.categoryId, status: input.status }).eq("id", id); if (error) throw new Error(error.code === "23505" ? "That SKU is already in use." : "Unable to update the product."); }
export async function removeNewAdminProduct(id: string) { const supabase = await createServerSupabaseClient(); await supabase.from("products").delete().eq("id", id); }
export async function archiveAdminProduct(id: string) { const supabase = await createServerSupabaseClient(); const { error } = await supabase.from("products").update({ status: "archived" }).eq("id", id); if (error) throw new Error("Unable to deactivate the product."); }
export async function replaceAdminProductImage(productId: string, image: File) { const supabase = await createServerSupabaseClient(); const extension = image.type === "image/png" ? "png" : image.type === "image/webp" ? "webp" : "jpg"; const path = `${productId}/${crypto.randomUUID()}.${extension}`; const { error: uploadError } = await supabase.storage.from(imageBucket).upload(path, image, { contentType: image.type, upsert: false }); if (uploadError) throw new Error("Image upload failed."); const { data: oldImages, error: readError } = await supabase.from("product_images").select("id,storage_path").eq("product_id", productId).order("sort_order").limit(1); if (readError) { await supabase.storage.from(imageBucket).remove([path]); throw new Error("Unable to save the product image."); } const old = oldImages?.[0]; const { error } = old ? await supabase.from("product_images").update({ storage_path: path }).eq("id", old.id) : await supabase.from("product_images").insert({ product_id: productId, storage_path: path, sort_order: 0 }); if (error) { await supabase.storage.from(imageBucket).remove([path]); throw new Error("Unable to save the product image."); } if (old?.storage_path) await supabase.storage.from(imageBucket).remove([old.storage_path]); }
