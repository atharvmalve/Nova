"use client";

/* Signed Supabase Storage URLs are dynamic, so Next Image remote allowlists are not suitable here. */
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";

import type { ProductImage } from "@/services/products";

export function ProductGallery({ images, title }: { images: ProductImage[]; title: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex];

  return <div className="grid gap-3"><div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-stone-100">{activeImage?.url ? <img alt={activeImage.alt} className="size-full object-cover" src={activeImage.url} /> : <div aria-label={activeImage?.alt ?? title} className="absolute inset-0 bg-[linear-gradient(145deg,#e0d5c5,#a89177)]" role="img" />}</div>{images.length > 1 ? <div className="grid grid-cols-5 gap-2">{images.map((image, index) => <button aria-label={`View image ${index + 1}`} aria-pressed={index === activeIndex} className={`aspect-square overflow-hidden rounded-md border-2 ${index === activeIndex ? "border-primary" : "border-transparent"}`} key={image.id} onClick={() => setActiveIndex(index)} type="button">{image.url ? <img alt="" className="size-full object-cover" src={image.url} /> : <span className="block size-full bg-stone-200" />}</button>)}</div> : null}</div>;
}
