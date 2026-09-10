import "server-only";

import { cache } from "react";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type StorefrontProduct = {
  id: string;
  title: string;
  slug: string;
  pricePaise: number;
  compareAtPricePaise: number | null;
  categoryName: string | null;
  imageAlt: string | null;
};

export type StorefrontCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export type ServiceResult<T> =
  | { data: T; error: null }
  | { data: T; error: "Unable to load storefront data." };

type ProductRow = {
  id: string;
  title: string;
  slug: string;
  price_paise: number;
  compare_at_price_paise: number | null;
  categories: { name: string } | null;
  product_images: { alt_text: string | null }[] | null;
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

type ProductImageRow = {
  id: string;
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
};

type ProductDetailRow = Omit<ProductRow, "categories" | "product_images"> & {
  description: string | null;
  inventory_quantity: number;
  track_inventory: boolean;
  category_id: string | null;
  categories: { id: string; name: string; slug: string } | null;
  product_images: ProductImageRow[] | null;
};

export type ProductImage = {
  id: string;
  alt: string;
  url: string | null;
};

export type ProductDetail = StorefrontProduct & {
  description: string | null;
  categoryId: string | null;
  categorySlug: string | null;
  inventoryQuantity: number;
  trackInventory: boolean;
  isInStock: boolean;
  images: ProductImage[];
};

const catalogQuerySchema = z.object({
  category: z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
  q: z.string().trim().max(100).catch(""),
});

export type CatalogQuery = z.infer<typeof catalogQuerySchema>;

export type ProductCatalogPage = {
  items: StorefrontProduct[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

export function parseCatalogQuery(input: {
  category?: string | string[];
  page?: string | string[];
  q?: string | string[];
}): CatalogQuery {
  return catalogQuerySchema.parse({
    category: typeof input.category === "string" ? input.category : undefined,
    page: typeof input.page === "string" ? input.page : undefined,
    q: typeof input.q === "string" ? input.q : undefined,
  });
}

function mapProduct(product: ProductRow): StorefrontProduct {
  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    pricePaise: product.price_paise,
    compareAtPricePaise: product.compare_at_price_paise,
    categoryName: product.categories?.name ?? null,
    imageAlt: product.product_images?.[0]?.alt_text ?? null,
  };
}

async function getProductImageUrl(storagePath: string): Promise<string | null> {
  if (storagePath.startsWith("https://") || storagePath.startsWith("http://")) {
    return storagePath;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.storage
    .from("product-images")
    .createSignedUrl(storagePath, 60 * 60);

  return error ? null : data.signedUrl;
}

const productSlugSchema = z.string().trim().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const getProductBySlug = cache(async (slug: string): Promise<ServiceResult<ProductDetail | null>> => {
  const parsedSlug = productSlugSchema.safeParse(slug);
  if (!parsedSlug.success) {
    return { data: null, error: null };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("products")
      .select("id, title, slug, description, price_paise, compare_at_price_paise, inventory_quantity, track_inventory, category_id, categories(id, name, slug), product_images(id, storage_path, alt_text, sort_order)")
      .eq("slug", parsedSlug.data)
      .eq("status", "active")
      .order("sort_order", { referencedTable: "product_images", ascending: true })
      .maybeSingle();

    if (error) {
      return { data: null, error: "Unable to load storefront data." };
    }

    if (!data) {
      return { data: null, error: null };
    }

    const product = data as unknown as ProductDetailRow;
    const images = await Promise.all(
      (product.product_images ?? []).map(async (image) => ({
        id: image.id,
        alt: image.alt_text ?? product.title,
        url: await getProductImageUrl(image.storage_path),
      })),
    );
    const isInStock = !product.track_inventory || product.inventory_quantity > 0;

    return {
      data: {
        ...mapProduct(product),
        description: product.description,
        categoryId: product.category_id,
        categorySlug: product.categories?.slug ?? null,
        inventoryQuantity: product.inventory_quantity,
        trackInventory: product.track_inventory,
        isInStock,
        images,
      },
      error: null,
    };
  } catch {
    return { data: null, error: "Unable to load storefront data." };
  }
});

export async function getRelatedProducts(
  productId: string,
  categoryId: string | null,
  limit = 4,
): Promise<ServiceResult<StorefrontProduct[]>> {
  try {
    const supabase = await createServerSupabaseClient();
    let query = supabase
      .from("products")
      .select("id, title, slug, price_paise, compare_at_price_paise, categories(name), product_images(alt_text, sort_order)")
      .eq("status", "active")
      .neq("id", productId);

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(Math.min(Math.max(limit, 1), 8));

    if (error) {
      return { data: [], error: "Unable to load storefront data." };
    }

    return { data: ((data ?? []) as unknown as ProductRow[]).map(mapProduct), error: null };
  } catch {
    return { data: [], error: "Unable to load storefront data." };
  }
}

/** Latest active products are the homepage's featured collection. */
export async function getFeaturedProducts(limit = 4): Promise<ServiceResult<StorefrontProduct[]>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("products")
      .select("id, title, slug, price_paise, compare_at_price_paise, categories(name), product_images(alt_text, sort_order)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return { data: [], error: "Unable to load storefront data." };
    }

    return {
      data: ((data ?? []) as unknown as ProductRow[]).map(mapProduct),
      error: null,
    };
  } catch {
    return { data: [], error: "Unable to load storefront data." };
  }
}

export async function getProductCatalog(
  input: CatalogQuery,
  perPage = 12,
): Promise<ServiceResult<ProductCatalogPage>> {
  const page = input.page;
  const safePerPage = Math.min(Math.max(perPage, 1), 48);
  const from = (page - 1) * safePerPage;

  try {
    const supabase = await createServerSupabaseClient();
    const select = input.category
      ? "id, title, slug, price_paise, compare_at_price_paise, categories!inner(name, slug), product_images(alt_text, sort_order)"
      : "id, title, slug, price_paise, compare_at_price_paise, categories(name, slug), product_images(alt_text, sort_order)";

    let query = supabase
      .from("products")
      .select(select, { count: "exact" })
      .eq("status", "active");

    if (input.category) {
      query = query.eq("categories.slug", input.category);
    }

    if (input.q) {
      query = query.ilike("title", `%${input.q}%`);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, from + safePerPage - 1);

    if (error) {
      return {
        data: { items: [], page, perPage: safePerPage, total: 0, totalPages: 0 },
        error: "Unable to load storefront data.",
      };
    }

    const total = count ?? 0;
    return {
      data: {
        items: ((data ?? []) as unknown as ProductRow[]).map(mapProduct),
        page,
        perPage: safePerPage,
        total,
        totalPages: Math.ceil(total / safePerPage),
      },
      error: null,
    };
  } catch {
    return {
      data: { items: [], page, perPage: safePerPage, total: 0, totalPages: 0 },
      error: "Unable to load storefront data.",
    };
  }
}

export async function getActiveCategories(limit = 6): Promise<ServiceResult<StorefrontCategory[]>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, description")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })
      .limit(limit);

    if (error) {
      return { data: [], error: "Unable to load storefront data." };
    }

    return { data: (data ?? []) as CategoryRow[], error: null };
  } catch {
    return { data: [], error: "Unable to load storefront data." };
  }
}
