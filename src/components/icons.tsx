
'use client';

import * as React from 'react';
import Image from "next/image";
import placeholderData from "@/app/lib/placeholder-images.json";
import { cn } from '@/lib/utils';

export function Fut7StatsLogo({ className, width = 100, height = 100 }: { className?: string, width?: number, height?: number }) {
  const logo = placeholderData.placeholderImages.find(img => img.id === 'club-logo');
  const [hasError, setHasError] = React.useState(false);
  
  // Renderiza un logo vectorial elegante basado en tipografía si falla la imagen o la URL es restringida
  const renderFallback = () => (
    <div 
      className={cn(
        "flex items-center justify-center bg-gradient-to-br from-primary via-primary/80 to-accent rounded-xl border-2 border-white/20 shadow-2xl overflow-hidden relative group",
        className
      )}
      style={{ width, height }}
    >
      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
      <div className="flex flex-col items-center justify-center relative z-10">
        <span className="font-bebas text-white leading-none tracking-tighter select-none" style={{ fontSize: width * 0.5 }}>RA</span>
        <div className="h-[2px] w-1/2 bg-white/40 mt-1" />
      </div>
    </div>
  );

  // Forzamos el fallback si la imagen actual es la de Firebase que da 403
  if (hasError || !logo?.imageUrl || logo.imageUrl.includes('firebasestorage')) {
    return renderFallback();
  }

  return (
    <div className={cn("relative overflow-hidden flex items-center justify-center rounded-xl", className)} style={{ width, height }}>
      <Image 
        src={logo.imageUrl}
        alt="Escudo Oficial Real Acade"
        fill
        className="object-cover"
        onError={() => setHasError(true)}
        priority
        sizes="(max-width: 768px) 100px, 200px"
      />
    </div>
  );
}
