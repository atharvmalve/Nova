import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ShopPageContent } from "../page";

const categoryMetadata = {
  sofas: { title: "Italian Sofas | Designer Luxury Sofas", description: "Explore designer Italian sofas by Novae Studio, from sculptural modular forms to refined contemporary seating for sophisticated interiors." },
  armchairs: { title: "Italian Armchairs | Designer Armchairs", description: "Explore Novae Studio's collection of designer Italian armchairs, combining sculptural forms, refined materials and contemporary craftsmanship." },
} as const;
type CategoryPageProps = { params: Promise<{ category: string }> };
export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> { const { category } = await params; const entry = categoryMetadata[category as keyof typeof categoryMetadata]; return entry ? { title: entry.title, description: entry.description, alternates: { canonical: `/shop/${category}` }, openGraph: { title: `${entry.title} | Novae Studio`, description: entry.description, url: `/shop/${category}` } } : { robots: { index: false, follow: false } }; }
export default async function CategoryPage({ params }: CategoryPageProps) { const { category } = await params; if (!(category in categoryMetadata)) notFound(); return <ShopPageContent category={category} />; }
