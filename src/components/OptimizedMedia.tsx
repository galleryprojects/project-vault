'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface OptimizedMediaProps {
  src: string;
  alt?: string;
  type: 'image' | 'video';
  className?: string;
  priority?: boolean;
}

export default function OptimizedMedia({ src, alt = "media", type, className = "", priority = false }: OptimizedMediaProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  const optimizedSrc = type === 'image' 
    ? `${src}?width=400&quality=75` 
    : src;

  if (type === 'video') {
    return (
      <div className={`relative w-full h-full bg-black overflow-hidden ${className}`}>
        <video
          src={src}
          className={`w-full h-full object-cover transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          autoPlay loop muted playsInline
          onLoadedData={() => setIsLoaded(true)}
          preload="metadata" 
        />
        {!isLoaded && <div className="absolute inset-0 bg-[#111] animate-pulse" />}
      </div>
    );
  }

  // Inside your OptimizedMedia component
    return (
    <div className={`relative w-full h-full bg-[#111] overflow-hidden ${className}`}>
        // Inside OptimizedMedia.tsx
        <Image
        src={optimizedSrc}
        alt={alt}
        fill
        priority={priority}
        // [THE FIX]: If priority is true, FORCE eager loading. If false, lazy load.
        loading={priority ? 'eager' : 'lazy'} 
        unoptimized
        className={`object-cover transition-all duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setIsLoaded(true)}
        />
    </div>
    );
}