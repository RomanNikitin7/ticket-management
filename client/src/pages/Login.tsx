import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navigate, useNavigate } from "react-router";
import { authClient } from "../lib/auth-client";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Enter your email.")
    .email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

type LoginValues = z.infer<typeof loginSchema>;

const fieldClass =
  "mt-1.5 w-full rounded-md border-2 border-ink/25 bg-white px-3 py-2.5 text-base " +
  "transition-colors outline-none focus:border-ink focus:outline-none focus-visible:outline-none " +
  "aria-invalid:border-alert focus:aria-invalid:border-alert";

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
    <div className="mx-auto mt-6 w-full max-w-md sm:mt-14">
      <div className="ticket relative">
        <header className="flex h-[7.5rem] flex-col justify-center px-8">
          <h1 className="text-4xl font-extrabold leading-none tracking-tight">
            Support desk
          </h1>
          <p className="mt-2 text-base text-ink/70">
            Sign in to pick up your tickets.
          </p>
        </header>
        <div className="ticket-perforation" aria-hidden="true" />
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="no-outline space-y-5 px-8 pt-7 pb-8"
        >
          <div>
            <label htmlFor="email" className="block text-sm font-semibold">
              Work email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register("email")}
              className={fieldClass}
            />
            {errors.email && (
              <p role="alert" className="mt-1.5 text-sm font-semibold text-alert">
                {errors.email.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-semibold">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              {...register("password")}
              className={fieldClass}
            />
            {errors.password && (
              <p role="alert" className="mt-1.5 text-sm font-semibold text-alert">
                {errors.password.message}
              </p>
            )}
          </div>
          {error && (
            <p role="alert" className="text-sm font-semibold text-alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-highlight px-4 py-3 text-base font-extrabold text-ink transition-[filter,transform] hover:brightness-95 active:translate-y-px disabled:opacity-60"
          >
            {isSubmitting ? "Signing in" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
