/**
 * CONSOLIDATION: This root page was causing a collision with src/app/(app)/admin/migration/page.tsx.
 * Route group logic is handled in (app) to benefit from the official layout.
 * We remove the default export to prevent Next.js from seeing this as a parallel route.
 */
// export default function InertPage() { return null; }
const PageConflictResolver = () => null;
