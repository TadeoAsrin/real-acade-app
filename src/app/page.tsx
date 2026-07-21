
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/dashboard");
}

export const dynamic = 'force-static';
