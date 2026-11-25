import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function Layout() {
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  async function handleSignOut() {
    await authClient.signOut();
    navigate("/login", { replace: true });
  }

  if (pathname === "/login") return <Outlet />;

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-10 bg-ink text-paper shadow-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-6">
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-md text-lg font-extrabold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-highlight"
          >
            <span
              aria-hidden="true"
              className="size-5 rounded-[5px] bg-highlight [mask:radial-gradient(circle_0.3rem_at_0_50%,#0000_96%,#000)_left/51%_100%_no-repeat,radial-gradient(circle_0.3rem_at_100%_50%,#0000_96%,#000)_right/51%_100%_no-repeat]"
            />
            Ticket Management
          </Link>
          {session?.user.role === "admin" && (
            <nav aria-label="Main">
              <NavLink
                to="/users"
                className={({ isActive }) =>
                  `rounded-md px-3 py-1.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-highlight ${
                    isActive ? "bg-paper/10 text-paper" : "text-paper/80 hover:text-paper"
                  }`
                }
              >
                Users
              </NavLink>
            </nav>
          )}
          {session && (
            <div className="ml-auto flex items-center gap-3">
              <Avatar className="size-8 bg-highlight">
                <AvatarFallback className="bg-highlight text-sm font-extrabold text-ink">
                  {session.user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-[12rem] truncate text-sm font-semibold sm:block">
                {session.user.name}
              </span>
              <Button
                type="button"
                variant="ghost"
                onClick={handleSignOut}
                className="text-paper/80 hover:bg-paper/10 hover:text-paper"
              >
                Sign out
              </Button>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
