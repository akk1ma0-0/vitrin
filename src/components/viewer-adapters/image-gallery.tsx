"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ImageGallery({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) return null;

  return (
    <div className="relative mx-auto max-w-3xl">
      <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-surface">
        <Image src={images[index]} alt={alt} fill className="object-contain" unoptimized />
      </div>

      {images.length > 1 && (
        <>
          <Button
            variant="secondary"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2"
            onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
            aria-label="Previous image"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2"
            onClick={() => setIndex((i) => (i + 1) % images.length)}
            aria-label="Next image"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="mt-3 flex justify-center gap-1.5">
            {images.map((img, i) => (
              <button
                key={img}
                onClick={() => setIndex(i)}
                aria-label={`Go to image ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-[var(--accent)]" : "w-1.5 bg-surface-hover"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
