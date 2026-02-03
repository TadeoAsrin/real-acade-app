import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="relative">
        <div className="absolute inset-0 bg-dot-pattern pointer-events-none opacity-50" />
        <Header />
        <main className="relative min-h-[calc(100vh-4rem)] p-4 lg:p-8 z-0">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}