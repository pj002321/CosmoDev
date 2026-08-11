import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/admin";
import AdminInquiriesList from "@/components/admin/AdminInquiriesList";

export const dynamic = "force-dynamic";

export default async function AdminInquiriesPage() {
  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;
  if (!isAdminEmail(email)) redirect("/");

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <p className="font-mono text-xs text-muted mb-2 animate-fade-in">▸ ADMIN</p>
      <h1 className="text-2xl font-semibold mb-8">문의 관리</h1>
      <AdminInquiriesList />
    </div>
  );
}
