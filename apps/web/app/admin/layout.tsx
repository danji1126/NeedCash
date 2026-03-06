import { AuthProvider } from "@/components/admin/auth-provider";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-bg">
        <header className="border-b border-border/60 px-6 py-4">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <h1 className="font-heading text-lg font-bold">NeedCash Admin</h1>
            <AdminNav />
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </div>
    </AuthProvider>
  );
}
