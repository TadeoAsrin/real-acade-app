
'use client';

import * as React from 'react';
import placeholderData from "@/app/lib/placeholder-images.json";
import { cn } from '@/lib/utils';

export function Fut7StatsLogo({ className, width = 100, height = 100 }: { className?: string, width?: number, height?: number }) {
  const logo = placeholderData.placeholderImages.find(img => img.id === 'club-logo');
  const [hasError, setHasError] = React.useState(false);
  
  // Usamos una etiqueta <img> estándar para evitar el procesamiento de Next.js
  // que suele causar bloqueos 403 con servidores externos como Imgur o Firebase.
  
  const renderFallback = () => (
    <div 
      className={cn(
        "flex flex-col items-center justify-center bg-gradient-to-br from-primary via-primary/80 to-accent rounded-2xl border-2 border-white/20 shadow-2xl overflow-hidden relative group",
        className
      )}
      style={{ width, height }}
    >
      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
      <div className="flex flex-col items-center justify-center relative z-10">
        <span className="font-bebas text-white leading-none tracking-tighter select-none" style={{ fontSize: width * 0.45 }}>RA</span>
        <div className="h-[2px] w-1/3 bg-yellow-500 mt-1 shadow-[0_0_8px_rgba(234,179,8,0.8)]" />
      </div>
      <div className="absolute -bottom-1 -right-1 opacity-20">
        <svg width={width * 0.4} height={width * 0.4} viewBox="0 0 24 24" fill="white">
          <path d="M12 2L4 5V11C4 16.07 7.41 20.83 12 22C16.59 20.83 20 16.07 20 11V5L12 2Z" />
        </svg>
      </div>
    </div>
  );

  if (hasError || !logo?.imageUrl) {
    return renderFallback();
  }

  return (
    <div className={cn("relative overflow-hidden flex items-center justify-center rounded-2xl border-2 border-white/5 bg-black/40 shadow-inner", className)} style={{ width, height }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src={logo.imageUrl}
        alt="Escudo Oficial Real Acade"
        className="object-contain p-1 w-full h-full drop-shadow-2xl transition-transform hover:scale-110 duration-500"
        onError={() => setHasError(true)}
      />
    </div>
  );
}
