'use client';

import * as React from 'react';
import Image from "next/image";
import placeholderData from "@/app/lib/placeholder-images.json";
import { cn } from '@/lib/utils';

export function Fut7StatsLogo({ className, width = 100, height = 100 }: { className?: string, width?: number, height?: number }) {
  const logo = placeholderData.placeholderImages.find(img => img.id === 'club-logo');
  const [error, setError] = React.useState(false);
  
  // Fallback visual en caso de error de carga o imagen vacía
  if (error || !logo?.imageUrl) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-primary to-primary/60 rounded-lg border border-white/20 shadow-lg",
          className
        )}
        style={{ width, height }}
      >
        <span className="font-bebas text-white tracking-tighter select-none" style={{ fontSize: width * 0.45 }}>RA</span>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden flex items-center justify-center", className)} style={{ width, height }}>
      <Image 
        src={logo.imageUrl}
        alt="Escudo Oficial Real Acade"
        fill
        className="object-contain"
        onError={() => setError(true)}
        priority
        sizes="(max-width: 768px) 100px, 200px"
      />
    </div>
  );
}