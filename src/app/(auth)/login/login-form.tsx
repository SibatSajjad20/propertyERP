"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [formError, setFormError] = useState<string | null>(null);
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
    window.location.replace("/inventory");
  }

  return (
    <form
      className="space-y-4"
      method="post"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <div className="space-y-1.5 text-left">
        <Label htmlFor="email" className="text-[12px] font-medium text-ink-muted">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          autoFocus
          aria-invalid={Boolean(errors.email)}
          placeholder="name@sardarsmall.local"
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-[11px] text-sold" role="alert">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5 text-left">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-[12px] font-medium text-ink-muted">
            Password
          </Label>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.password)}
          placeholder="••••••••••••"
          {...register("password")}
        />
        {errors.password ? (
          <p className="text-[11px] text-sold" role="alert">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      {formError ? (
        <div
          className="rounded-[4px] border border-sold/30 bg-sold/5 p-2.5 text-[12px] text-sold"
          role="alert"
        >
          {formError}
        </div>
      ) : null}

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full"
          loading={isSubmitting}
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </div>
    </form>
  );
}
