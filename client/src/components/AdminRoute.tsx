import { Navigate, Outlet } from "react-router";
import { authClient } from "@/lib/auth-client";

// Must be nested inside ProtectedRoute (which handles the signed-out case).
export default function AdminRoute() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return <p className="text-sm text-gray-600">Loading...</p>;
  if (session?.user.role !== "admin") return <Navigate to="/" replace />;
  return <Outlet />;
}
