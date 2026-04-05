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

  // GLOBAL FIX: Automatically optimize Supabase images
  // Shrinks 10MB images down to ~50KB for the grid
  const optimizedSrc = type === 'image' 
    ? `${src}?width=400&quality=75` 
    : src;

  if (type === 'video') {
    return (
      <div className={`relative w-full h-full bg-black overflow-hidden ${className}`}>
        <video
          src={src}
          className={`w-full h-full object-cover transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setIsLoaded(true)}
          // Prevents browser from downloading the whole video at once
          preload="metadata" 
        />
        {!isLoaded && <div className="absolute inset-0 bg-[#111] animate-pulse" />}
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full bg-[#111] overflow-hidden ${className}`}>
      <Image
        src={optimizedSrc}
        alt={alt}
        fill
        priority={priority}
        className={`object-cover transition-all duration-700 ${isLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-110 blur-2xl'}`}
        onLoadingComplete={() => setIsLoaded(true)}
        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
      />
    </div>
  );
}