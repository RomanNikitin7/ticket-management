import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navigate, useNavigate } from "react-router";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Enter your email.")
    .email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

type LoginValues = z.infer<typeof loginSchema>;

const inputClass =
  "h-11 rounded-md border-ink/25 bg-white px-3 text-base focus-visible:border-ink focus-visible:ring-ink/20 aria-invalid:border-alert aria-invalid:ring-alert/20";


export default function Login() {
  const { data: session, isPending } = authClient.useSession();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  if (!isPending && session) return <Navigate to="/" replace />;

  async function onSubmit({ email, password }: LoginValues) {
    setError(null);
    const { error } = await authClient.signIn.email({ email, password });
    if (error) {
      setError(
        error.status === 401
          ? "Email or password is incorrect. Check both and try again."
          : "Could not sign in. Try again in a moment.",
      );
      return;
    }
    navigate("/", { replace: true });
  }

  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10">
        <div className="w-full max-w-md overflow-hidden rounded-xl bg-paper shadow-[0_24px_60px_-24px_rgba(23,36,30,0.45)] ring-1 ring-ink/10">
          <div className="h-1.5 bg-highlight" aria-hidden="true" />
          <div className="px-8 pt-8 pb-9 sm:px-10">
          <p className="mb-10 text-lg font-extrabold tracking-tight">
            Ticket Management
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight">Sign in</h1>
          <p className="mt-2 text-ink/70">Use your work email to open the queue.</p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">
                Work email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={!!errors.email}
                {...register("email")}
                className={inputClass}
              />
              {errors.email && (
                <p role="alert" className="text-sm font-medium text-alert">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                {...register("password")}
                className={inputClass}
              />
              {errors.password && (
                <p role="alert" className="text-sm font-medium text-alert">
                  {errors.password.message}
                </p>
              )}
            </div>
            {error && (
              <p
                role="alert"
                className="rounded-md border border-alert/30 bg-alert/5 px-3 py-2.5 text-sm font-medium text-alert"
              >
                {error}
              </p>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 w-full bg-ink text-base font-semibold text-paper hover:bg-ink/90"
            >
              {isSubmitting ? "Signing in" : "Sign in"}
            </Button>
          </form>
          </div>
        </div>
      </main>
  );
}
