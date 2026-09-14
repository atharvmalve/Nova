"use client";

/* Signed Supabase image URLs can use deployment-specific hosts, so these remain native responsive images. */
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState } from "react";

import type { ProductImage } from "@/services/products";

export function ProductGallery({ images, title }: { images: ProductImage[]; title: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const total = images.length;
  const activeImage = images[activeIndex];
  const previous = useCallback(() => setActiveIndex((index) => (index - 1 + total) % total), [total]);
  const next = useCallback(() => setActiveIndex((index) => (index + 1) % total), [total]);

  useEffect(() => {
    if (!isViewerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setIsViewerOpen(false); if (event.key === "ArrowLeft") previous(); if (event.key === "ArrowRight") next(); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKeyDown); };
  }, [isViewerOpen, next, previous]);

  if (!activeImage) return <div aria-label={title} className="aspect-[4/5] bg-[#e6e2d9]" role="img" />;
  return <><section aria-label={`${title} gallery`} className="relative"><button aria-label={`Expand ${activeImage.alt}`} className="block w-full cursor-zoom-in overflow-hidden bg-[#eeece6]" onClick={() => setIsViewerOpen(true)} type="button">{activeImage.url ? <img alt={activeImage.alt} className="aspect-[4/5] w-full object-cover" src={activeImage.url} /> : <span className="block aspect-[4/5] bg-[#e6e2d9]" />}</button>{total > 1 ? <div className="absolute bottom-5 right-5 flex items-center gap-5 bg-white/80 px-4 py-2 text-sm backdrop-blur-sm"><button aria-label="Previous image" className="cursor-pointer transition-opacity hover:opacity-45" onClick={previous} type="button">←</button><span className="text-[10px] tracking-[.14em] text-black/55">{String(activeIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span><button aria-label="Next image" className="cursor-pointer transition-opacity hover:opacity-45" onClick={next} type="button">→</button></div> : null}</section>{isViewerOpen ? <ImageViewer activeImage={activeImage} activeIndex={activeIndex} images={images} onClose={() => setIsViewerOpen(false)} onNext={next} onPrevious={previous} /> : null}</>;
}

function ImageViewer({ images, activeImage, activeIndex, onClose, onPrevious, onNext }: { images: ProductImage[]; activeImage: ProductImage; activeIndex: number; onClose: () => void; onPrevious: () => void; onNext: () => void }) {
  return <div aria-label="Expanded image viewer" aria-modal="true" className="fixed inset-0 z-50 flex bg-white p-5 sm:p-10" role="dialog"><button aria-label="Close image viewer" className="absolute right-5 top-5 z-10 cursor-pointer text-xs uppercase tracking-[.16em] sm:right-10 sm:top-10" onClick={onClose} type="button">Close</button><div className="relative flex size-full items-center justify-center">{activeImage.url ? <img alt={activeImage.alt} className="max-h-full max-w-full object-contain" src={activeImage.url} /> : <span className="size-full bg-[#e6e2d9]" />}{images.length > 1 ? <div className="absolute bottom-0 right-0 flex items-center gap-5 text-sm"><button aria-label="Previous image" className="cursor-pointer" onClick={onPrevious} type="button">←</button><span className="text-[10px] tracking-[.14em] text-black/55">{activeIndex + 1} / {images.length}</span><button aria-label="Next image" className="cursor-pointer" onClick={onNext} type="button">→</button></div> : null}</div></div>;
}
