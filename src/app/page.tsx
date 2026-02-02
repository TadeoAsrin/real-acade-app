import { redirect } from "next/navigation";

export default function Home() {
  // For this example, we redirect to the login page.
  // In a real app, you'd check for an active session.
  redirect("/login");
}
