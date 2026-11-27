import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import StudioEditor from "./studio-editor";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["ADMIN", "OPERATOR", "ADVERTISER", "PARTNER"];

export default async function StudioPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/sign-in");
  if (!ALLOWED_ROLES.includes(user.role)) redirect("/");

  return <StudioEditor />;
}
