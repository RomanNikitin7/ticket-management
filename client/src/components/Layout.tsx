import { Link, Outlet, useNavigate } from "react-router";
import { authClient } from "../lib/auth-client";

export default function Layout() {
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();

  async function handleSignOut() {
    await authClient.signOut();
    navigate("/login", { replace: true });
  }

  return (
    <>
      <header className="bg-ink text-paper">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-6">
          <Link to="/" className="text-lg font-extrabold tracking-tight focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-highlight">
            Ticket Management
          </Link>
          {session && (
            <div className="ml-auto flex items-center gap-3">
              <span
                aria-hidden="true"
                className="grid size-8 place-items-center rounded-full bg-highlight text-sm font-extrabold text-ink"
              >
                {session.user.name.charAt(0).toUpperCase()}
              </span>
              <span className="max-w-[10rem] truncate text-sm font-semibold">
                {session.user.name}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-md border-2 border-paper/40 px-3 py-1 text-sm font-semibold transition-colors hover:border-highlight hover:text-highlight focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-highlight"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </main>
    </>
  );
}
