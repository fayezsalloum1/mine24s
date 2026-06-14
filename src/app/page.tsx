import { getAppUser } from "@/lib/session";
import { redirect } from "next/navigation";
import LandingPage from "@/components/LandingPage";

export default async function Home() {
  const { appUser, requires2FA } = await getAppUser();
  if (appUser && !requires2FA) redirect("/dashboard");
  return <LandingPage />;
}
