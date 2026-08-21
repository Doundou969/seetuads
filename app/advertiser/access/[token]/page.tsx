import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function TemporaryAdvertiserAccess({
  params,
}: PageProps) {
  const { token } = await params;

  if (!token) {
    redirect("/");
  }

  redirect(`/api/advertiser/access-link/${token}`);
}
