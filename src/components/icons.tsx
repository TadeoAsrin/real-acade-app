
'use client';

import Image from "next/image";
import placeholderData from "@/app/lib/placeholder-images.json";

export function Fut7StatsLogo({ className, width = 100, height = 100 }: { className?: string, width?: number, height?: number }) {
  const logo = placeholderData.placeholderImages.find(img => img.id === 'club-logo');
  
  return (
    <div className={className}>
      <Image 
        src={logo?.imageUrl || "https://picsum.photos/seed/realacadelogo/400/400"}
        alt="Escudo Oficial Real Acade"
        width={width}
        height={height}
        className="object-contain"
        data-ai-hint="soccer crest"
      />
    </div>
  );
}
