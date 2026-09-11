import { ExpandedPrevia } from '@/components/previa/expanded-previa';
import { AdminPicanteControls } from '@/components/previa/admin-picante-controls';

export default function PreviaPage() {
  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-8 pb-20">
      <ExpandedPrevia />
      <AdminPicanteControls />
    </div>
  );
}
