import { Navigate, Outlet } from "react-router";
import { authClient } from "../lib/auth-client";

export default function ProtectedRoute() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return <p className="text-sm text-gray-600">Loading...</p>;
  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}
