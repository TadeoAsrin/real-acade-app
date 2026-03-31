'use client';

import * as React from 'react';
import { useCollection, useMemoFirebase, useFirestore, useUser, useDoc, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import type { Match, GalleryItem } from "@/lib/definitions";
import { Loader2, Plus, Play, X, Trash2, Camera, Video, Link as LinkIcon, ExternalLink, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function GalleryPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<GalleryItem | null>(null);
  
  // Form State
  const [uploadType, setUploadType] = React.useState<'image' | 'video'>('image');
  const [uploadUrl, setUploadUrl] = React.useState('');
  const [uploadDesc, setUploadDesc] = React.useState('');
  const [uploadCategory, setUploadCategory] = React.useState('Social');
  const [isSaving, setIsSaving] = React.useState(false);

  const galleryQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'gallery'), orderBy('date', 'desc'));
  }, [firestore]);

  const matchesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'matches'), orderBy('date', 'desc'));
  }, [firestore]);

  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);

  const { data: galleryData, isLoading: galleryLoading } = useCollection<GalleryItem>(galleryQuery);
  const { data: matchesData, isLoading: matchesLoading } = useCollection<Match>(matchesQuery);
  const { data: adminRole } = useDoc<{isAdmin: boolean}>(adminRoleRef);

  const isAdmin = adminRole?.isAdmin;

  // Combinar fotos de partidos con ítems de galería
  const allItems = React.useMemo(() => {
    const items: GalleryItem[] = [];
    
    // 1. Fotos de partidos
    if (matchesData) {
      matchesData.forEach(match => {
        if (match.photos) {
          match.photos.forEach((url, idx) => {
            items.push({
              id: `match-${match.id}-${idx}`,
              type: 'image',
              url,
              date: match.date,
              category: 'Partido',
              matchId: match.id,
              description: `Jornada del ${new Date(match.date).toLocaleDateString('es-ES')}`
            });
          });
        }
      });
    }

    // 2. Ítems de la colección exclusiva
    if (galleryData) {
      galleryData.forEach(item => {
        items.push(item);
      });
    }

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [matchesData, galleryData]);

  const handleUpload = async () => {
    if (!firestore || !uploadUrl) return;
    setIsSaving(true);
    
    const itemId = Math.random().toString(36).substring(2, 15);
    const itemRef = doc(firestore, 'gallery', itemId);
    
    const newItem: GalleryItem = {
      id: itemId,
      type: uploadType,
      url: uploadUrl,
      description: uploadDesc,
      date: new Date().toISOString(),
      category: uploadCategory
    };

    setDocumentNonBlocking(itemRef, newItem, {});
    
    toast({ title: "Subida Exitosa", description: "El momento ha sido guardado en la galería." });
    setUploadUrl('');
    setUploadDesc('');
    setIsUploadOpen(false);
    setIsSaving(false);
  };

  const handleDelete = (id: string) => {
    if (!firestore || !isAdmin) return;
    const itemRef = doc(firestore, 'gallery', id);
    deleteDocumentNonBlocking(itemRef);
    toast({ title: "Eliminado", description: "El ítem ha sido borrado de la galería exclusiva." });
  };

  if (galleryLoading || matchesLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 px-4">
      {/* 1. CINEMATIC HEADER */}
      <section className="cinematic-banner p-8 md:p-12 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />
        <div className="relative z-10 space-y-4 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <Badge className="bg-primary text-primary-foreground font-bebas tracking-widest px-3 py-1 text-sm rounded-none shadow-lg shadow-primary/20">EDICIÓN ESPECIAL</Badge>
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] font-oswald">MOMENTOS DE GLORIA</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bebas text-white tracking-wider leading-none uppercase">LA GALERÍA</h1>
          <p className="text-lg md:text-xl text-muted-foreground font-lora italic max-w-2xl">El archivo visual definitivo de la mística del Real Acade.</p>
        </div>

        {isAdmin && (
          <div className="relative z-10">
            <Button onClick={() => setIsUploadOpen(true)} size="lg" className="h-16 px-10 font-bebas text-2xl tracking-[0.2em] bg-white text-black hover:bg-white/90 shadow-[0_0_40px_rgba(255,255,255,0.25)] rounded-none transition-all group hover:px-12">
              <Plus className="mr-3 h-6 w-6" /> SUBIR MOMENTO
            </Button>
          </div>
        )}
      </section>

      {/* 2. GRID SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {allItems.map((item) => (
          <Card 
            key={item.id} 
            className="group competition-card border-none bg-black/40 hover-lift overflow-hidden relative aspect-square cursor-pointer shadow-2xl"
            onClick={() => setSelectedItem(item)}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
            
            {item.type === 'image' ? (
              <img src={item.url} alt={item.description} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 border border-white/5">
                <Play className="h-16 w-16 text-primary fill-primary/20 group-hover:scale-125 transition-transform duration-500" />
                <Badge variant="outline" className="mt-4 border-primary/20 text-primary">VIDEO EXCLUSIVO</Badge>
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-6 z-20 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black uppercase tracking-widest">{item.category}</Badge>
                  <p className="text-white font-black italic uppercase text-sm tracking-tight line-clamp-1">{item.description || 'Sin descripción'}</p>
                </div>
                {item.type === 'video' && <Video className="h-5 w-5 text-primary" />}
              </div>
            </div>

            {isAdmin && item.id.startsWith('gallery-') || !item.matchId && isAdmin && (
              <Button 
                variant="destructive" 
                size="icon" 
                className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-30"
                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </Card>
        ))}
      </div>

      {allItems.length === 0 && (
        <div className="text-center py-32 border-2 border-dashed border-white/5 rounded-[2rem] opacity-20">
          <ImageIcon className="h-16 w-16 mx-auto mb-6 opacity-50" />
          <p className="font-bebas text-3xl tracking-widest uppercase italic">Sin momentos capturados aún</p>
        </div>
      )}

      {/* 3. LIGHTBOX DIALOG */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] p-0 overflow-hidden bg-black/95 border-none shadow-2xl flex flex-col items-center justify-center">
          <DialogHeader className="sr-only">
            <DialogTitle>Visualizador de Galería</DialogTitle>
            <DialogDescription>Vista ampliada del momento seleccionado del club.</DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              <button 
                onClick={() => setSelectedItem(null)} 
                className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black rounded-full text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>

              {selectedItem.type === 'image' ? (
                <img src={selectedItem.url} alt={selectedItem.description} className="max-w-full max-h-[80vh] object-contain shadow-2xl" />
              ) : (
                <div className="w-full max-w-4xl aspect-video bg-black flex flex-col items-center justify-center gap-6">
                  <div className="p-10 rounded-full bg-primary/10 border-2 border-primary/20 animate-pulse">
                    <Play className="h-20 w-20 text-primary" />
                  </div>
                  <div className="text-center space-y-4">
                    <h2 className="text-3xl font-black italic uppercase text-white tracking-tighter">Vídeo de Élite</h2>
                    <Button asChild size="lg" className="bg-primary hover:bg-primary/90 font-bebas text-xl tracking-widest px-10">
                      <a href={selectedItem.url} target="_blank" rel="noopener noreferrer">
                        REPRODUCIR EN EXTERNO <ExternalLink className="ml-3 h-5 w-5" />
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              <div className="w-full p-8 bg-gradient-to-t from-black to-transparent space-y-2 text-center">
                <div className="flex items-center justify-center gap-3">
                  <Badge className="bg-primary/20 text-primary border-none text-[10px] font-black uppercase tracking-widest">{selectedItem.category}</Badge>
                  <span className="text-[10px] font-bold text-white/40 uppercase font-oswald">{new Date(selectedItem.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
                <h3 className="text-2xl font-black italic uppercase text-white tracking-tight">{selectedItem.description}</h3>
                {selectedItem.matchId && (
                  <Button variant="link" className="text-primary font-bold uppercase text-[10px] tracking-widest p-0 h-auto" asChild>
                    <a href={`/matches/${selectedItem.matchId}`}>IR A FICHA DEL PARTIDO</a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 4. UPLOAD DIALOG (Admin Only) */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="bg-surface-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-bebas text-3xl tracking-widest text-primary italic uppercase">SUBIR NUEVO MOMENTO</DialogTitle>
            <DialogDescription className="font-oswald uppercase text-[10px] tracking-widest text-muted-foreground/60">Añade contenido exclusivo a la historia del club.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tipo de Contenido</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant={uploadType === 'image' ? 'default' : 'outline'} 
                  className={cn("h-12 font-bold uppercase", uploadType === 'image' ? 'bg-primary text-white' : 'border-white/10')}
                  onClick={() => setUploadType('image')}
                >
                  <Camera className="mr-2 h-4 w-4" /> FOTO
                </Button>
                <Button 
                  variant={uploadType === 'video' ? 'default' : 'outline'} 
                  className={cn("h-12 font-bold uppercase", uploadType === 'video' ? 'bg-primary text-white' : 'border-white/10')}
                  onClick={() => setUploadType('video')}
                >
                  <Video className="mr-2 h-4 w-4" /> VÍDEO
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="url" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {uploadType === 'image' ? 'URL de la Imagen' : 'Link del Vídeo (YouTube/Vimeo)'}
              </Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="url" 
                  value={uploadUrl} 
                  onChange={(e) => setUploadUrl(e.target.value)} 
                  placeholder="https://..." 
                  className="bg-black/40 border-white/10 h-12 pl-10 font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descripción Corta</Label>
              <Input 
                id="desc" 
                value={uploadDesc} 
                onChange={(e) => setUploadDesc(e.target.value)} 
                placeholder="Ej: El festejo tras el gol de la victoria" 
                className="bg-black/40 border-white/10 h-12 font-bold italic"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Categoría</Label>
              <Select onValueChange={setUploadCategory} value={uploadCategory}>
                <SelectTrigger className="bg-black/40 border-white/10 h-12 font-bold uppercase italic">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent className="bg-surface-900 border-white/10">
                  {['Social', 'Táctico', 'Festejo', 'Jugada', 'Otro'].map(cat => (
                    <SelectItem key={cat} value={cat} className="font-bold uppercase italic">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleUpload} disabled={!uploadUrl || isSaving} className="w-full h-14 font-bebas text-xl tracking-widest bg-primary text-white shadow-xl shadow-primary/20">
              {isSaving ? <Loader2 className="animate-spin" /> : "PUBLICAR EN GALERÍA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
