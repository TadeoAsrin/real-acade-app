import { ExpandedPrevia } from '@/components/previa/expanded-previa';
import { AdminPicanteControls } from '@/components/previa/admin-picante-controls';
import { ColdFormAudit } from '@/components/previa/cold-form-audit';

export default function PreviaPage() {
  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-8 pb-20">
      <ExpandedPrevia />
      <AdminPicanteControls />
      <ColdFormAudit />
    </div>
  );
}
