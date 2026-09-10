import "server-only";

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

type ServiceResult<T> =
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
      data: ((data ?? []) as unknown as ProductRow[]).map((product) => ({
        id: product.id,
        title: product.title,
        slug: product.slug,
        pricePaise: product.price_paise,
        compareAtPricePaise: product.compare_at_price_paise,
        categoryName: product.categories?.name ?? null,
        imageAlt: product.product_images?.[0]?.alt_text ?? null,
      })),
      error: null,
    };
  } catch {
    return { data: [], error: "Unable to load storefront data." };
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
