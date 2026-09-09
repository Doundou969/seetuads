import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  if (user.role === "ADMIN" || user.role === "OPERATOR") {
    redirect("/admin");
  }

  if (user.role === "PARTNER" && user.partner) {
    redirect("/partner");
  }

  if (user.role === "ADVERTISER") {
    redirect("/advertiser/dashboard");
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Tableau de bord
        </h1>

        <p className="text-gray-600 mb-8">
          Bienvenue sur SeetuAds
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500">
              Rôle
            </h3>

            <p className="text-2xl font-bold text-primary-600 mt-1">
              {user.role}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
