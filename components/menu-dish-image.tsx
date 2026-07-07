"use client";

import { useState } from "react";

interface MenuDishImageProps {
  src: string;
  alt: string;
}

export function MenuDishImage({ src, alt }: MenuDishImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="menu-photo-placeholder" aria-label={alt}>
        <span>Photo coming soon</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="menu-card-image"
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
