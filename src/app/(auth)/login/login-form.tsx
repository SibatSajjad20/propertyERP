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
  "h-11 w-full rounded-[8px] border border-line bg-[#F8FAFC] text-[13px] text-ink outline-none placeholder:text-ink-faint focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50";

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
      className="mt-8"
      method="post"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-labelledby="login-title"
    >
      <div>
        <Label
          htmlFor="email"
          className="mb-2 block text-[13px] font-medium tracking-normal text-[#334155]"
        >
          Email
        </Label>
        <div className="relative">
          <Envelope
            weight="regular"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#64748B]"
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
            className={cn(fieldClassName, "pr-3 pl-10")}
            {...register("email")}
          />
        </div>
        {errors.email ? (
          <p id="email-error" className="mt-1.5 text-[13px] text-[#9B2C2C]" role="alert">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="mt-5">
        <Label
          htmlFor="password"
          className="mb-2 block text-[13px] font-medium tracking-normal text-[#334155]"
        >
          Password
        </Label>
        <div className="relative">
          <Lock
            weight="regular"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#64748B]"
            aria-hidden="true"
          />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            className={cn(fieldClassName, "pr-10 pl-10")}
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
          <p
            id="password-error"
            className="mt-1.5 text-[13px] text-[#9B2C2C]"
            role="alert"
          >
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <div className="mt-3 flex justify-end">
        {/* TODO: wire up when a password-reset flow exists */}
        <a
          href="#"
          className="text-[13px] text-primary hover:text-accent-bright hover:underline"
        >
          Forgot password?
        </a>
      </div>

      <Button
        type="submit"
        variant="primary"
        loading={isSubmitting}
        leftIcon={<SignIn weight="regular" className="size-4" aria-hidden="true" />}
        className="mt-6 h-11 w-full gap-2 rounded-[8px] text-[14px] font-medium shadow-none"
      >
        {isSubmitting ? "Signing in…" : "Sign In"}
      </Button>

      {formError ? (
        <p className="mt-3 text-[13px] text-[#9B2C2C]" role="alert">
          {formError}
        </p>
      ) : null}

      <div className="relative mt-8">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-[#E3E7EC]" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-[12px] text-[#94A3B8]">or</span>
        </div>
      </div>

      <p className="mt-4 text-center text-[12px] text-[#94A3B8]">
        Authorized personnel only
      </p>
    </form>
  );
}
