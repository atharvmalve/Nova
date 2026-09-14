"use client";

import { useEffect, useState } from "react";

const testimonials = [
  { quote: "Novae helped us turn the dining room into something guests actually remember. The furniture feels considered without competing with the space.", name: "Sofia Moretti", place: "Maison Verde" },
  { quote: "We wanted the rooms to feel intimate, contemporary and distinctly European. The pieces gave the entire property a much stronger sense of identity.", name: "Matteo Rossi", place: "Villa Aurelia" },
  { quote: "The collection works beautifully in hospitality. Everything feels substantial, refined and designed to be experienced rather than simply looked at.", name: "Elena Bianchi", place: "Casa Nera" },
  { quote: "We were looking for furniture that could make the property feel more distinctive without becoming theatrical. Novae understood that balance immediately.", name: "Luca Ferri", place: "The Olive House" },
];

export function TestimonialCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => { const query = window.matchMedia("(prefers-reduced-motion: reduce)"); const update = () => setReducedMotion(query.matches); update(); query.addEventListener("change", update); return () => query.removeEventListener("change", update); }, []);
  useEffect(() => { if (paused || reducedMotion) return; const timer = window.setInterval(() => setActive((current) => (current + 1) % testimonials.length), 8500); return () => window.clearInterval(timer); }, [paused, reducedMotion]);
  const testimonial = testimonials[active];
  const move = (direction: -1 | 1) => setActive((current) => (current + direction + testimonials.length) % testimonials.length);
  return <section aria-label="Demo client testimonials" className="mx-auto max-w-[1600px] px-5 py-28 sm:px-8 sm:py-40 lg:px-12" onFocus={() => setPaused(true)} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}><div className="grid gap-14 lg:grid-cols-[.7fr_1.3fr]"><div><p className="font-editorial text-xl">WHAT OUR CLIENTS SAY</p><p className="mt-4 text-[10px] uppercase tracking-[.14em] text-black/45">Prototype hospitality testimonials</p></div><div className="min-h-72"><blockquote className="max-w-3xl"><p className="text-3xl leading-[1.17] tracking-[-.04em] transition-opacity duration-700 motion-reduce:transition-none sm:text-5xl">“{testimonial.quote}”</p><footer className="mt-10 text-sm leading-6"><p>{testimonial.name}</p><p className="font-editorial text-black/55">{testimonial.place}</p></footer></blockquote><div className="mt-14 flex items-center justify-end gap-5 text-sm"><button aria-label="Previous testimonial" className="cursor-pointer transition-opacity hover:opacity-45 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4" onClick={() => move(-1)} type="button">←</button><span className="text-[10px] tracking-[.15em] text-black/50">{String(active + 1).padStart(2, "0")} / {String(testimonials.length).padStart(2, "0")}</span><button aria-label="Next testimonial" className="cursor-pointer transition-opacity hover:opacity-45 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4" onClick={() => move(1)} type="button">→</button></div></div></div></section>;
}
