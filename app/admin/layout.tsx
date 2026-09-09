import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";
import { getCurrentUser } from "@/lib/permissions";

export default async function AdminLayout({
children,
}: {
children: React.ReactNode;
}) {
const user = await getCurrentUser();

if (!user) {
redirect("/sign-in");
}

if (user.role !== "ADMIN" && user.role !== "OPERATOR") {
redirect("/");
}

return (
<div className="min-h-screen bg-slate-50">
<div className="flex min-h-screen">
<AdminSidebar />

    <main className="min-w-0 flex-1 overflow-x-hidden">
      <div className="min-h-screen">
        <div className="mx-auto w-full max-w-[1800px] px-5 py-6 sm:px-7 lg:px-9 xl:px-10">
          {children}
        </div>
      </div>
    </main>
  </div>
</div>


);
}