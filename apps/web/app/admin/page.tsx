"use client";

import { useAuth } from "@/components/admin/auth-provider";
import { AdminLogin } from "@/components/admin/admin-login";
import { Dashboard } from "@/components/admin/dashboard";

export default function AdminPage() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return <AdminLogin />;
  return <Dashboard />;
}
