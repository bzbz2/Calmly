import { redirect } from "next/navigation";
import { auth } from "@/auth";
import MoodDashboard from "@/components/MoodDashboard";
import { accountOf } from "@/lib/account";

export default async function MoodPage() {
  const account = accountOf(await auth());
  if (account === "none") redirect("/"); // nothing to show before the first chat
  return <MoodDashboard guest={account === "guest"} />;
}
