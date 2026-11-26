"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Envelope, Eye, EyeSlash, Lock, SignIn } from "@phosphor-icons/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/cn";

const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

const fieldClassName =
  "h-10 w-full rounded-[8px] border border-line bg-[#FAFBFC] text-[13px] text-ink outline-none placeholder:text-ink-muted/60 transition-colors focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50";

export function LoginForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    const result = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    });
    if (result.error) {
      const fromApi = result.error.message?.trim();
      const err =
        fromApi && /too many|try again/i.test(fromApi)
          ? fromApi
          : "Invalid email or password.";
      setFormError(err);
      toast.error(err);
      return;
    }
    toast.success("Authentication successful");
    const session = await authClient.getSession();
    const mustChangePassword = Boolean(
      (session.data?.user as { mustChangePassword?: boolean } | undefined)
        ?.mustChangePassword,
    );
    window.location.replace(mustChangePassword ? "/settings/profile" : "/inventory");
  }

  return (
    <form
      className="mt-6 space-y-4"
      method="post"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-labelledby="login-title"
    >
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-[12.5px] font-medium text-ink">
          Email address
        </Label>
        <div className="relative">
          <Envelope
            weight="regular"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
            aria-hidden="true"
          />
          <input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            placeholder="you@sardarsmall.com"
            className={cn(fieldClassName, "pr-3 pl-9.5")}
            {...register("email")}
          />
        </div>
        {errors.email ? (
          <p id="email-error" className="text-[12px] text-bad" role="alert">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-[12.5px] font-medium text-ink">
            Password
          </Label>
        </div>
        <div className="relative">
          <Lock
            weight="regular"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
            aria-hidden="true"
          />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            className={cn(fieldClassName, "pr-10 pl-9.5")}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
            aria-label={showPassword ? "Hide characters" : "Show characters"}
          >
            {showPassword ? (
              <EyeSlash weight="regular" className="size-4" aria-hidden="true" />
            ) : (
              <Eye weight="regular" className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.password ? (
          <p id="password-error" className="text-[12px] text-bad" role="alert">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      {formError ? (
        <div
          className="rounded-[6px] border border-bad-soft bg-bad-soft/60 px-3 py-2 text-[12px] text-bad"
          role="alert"
        >
          {formError}
        </div>
      ) : null}

      <Button
        type="submit"
        variant="primary"
        loading={isSubmitting}
        leftIcon={<SignIn weight="regular" className="size-4" aria-hidden="true" />}
        className="h-10 w-full rounded-[8px] text-[13.5px] font-medium shadow-none"
      >
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
