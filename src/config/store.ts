export type StoreConfig = {
  name: string;
  siteUrl: string;
  description: string;
  tagline: string;
  branding: { logo: string | null; favicon: string; primaryColor: string; accentColor: string };
  contact: { email: string; phone: string | null; address: string | null };
  commerce: { currency: "INR"; currencySymbol: string; locale: string };
  social: { instagram: string | null; facebook: string | null; x: string | null };
  features: { reviews: false; wishlist: false; coupons: false; customerAccounts: false };
};

/** Public, deployment-specific identity. Secrets and store data stay in environment variables and Supabase. */
export const storeConfig = {
  name: "Novae Studio",
  siteUrl: "https://novaestudio.vercel.app",
  description: "Discover Novae Studio, a curated collection of Italian furniture including designer sofas, armchairs and refined pieces for contemporary interiors.",
  tagline: "Italian furniture for refined contemporary interiors.",
  branding: { logo: null, favicon: "/favicon.ico", primaryColor: "#18181b", accentColor: "#f4f1ea" },
  contact: { email: "hello@nova-demo.example", phone: null, address: null },
  commerce: { currency: "INR", currencySymbol: "₹", locale: "en-IN" },
  social: { instagram: null, facebook: null, x: null },
  features: { reviews: false, wishlist: false, coupons: false, customerAccounts: false },
} satisfies StoreConfig;
