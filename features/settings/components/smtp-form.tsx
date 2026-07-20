"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSettingsSecrets, useUpdateSettings } from "@/features/settings/api/use-settings";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, EyeOff } from "lucide-react";

const smtpSchema = z.object({
  smtp_email_user: z.string().email("Valid email is required"),
  smtp_email_pass: z.string().min(1, "Password is required"),
});

type SmtpFormValues = z.infer<typeof smtpSchema>;

export function SmtpForm() {
  // Raw credentials only exist on the admin-only secrets endpoint.
  const { data: secrets, isLoading } = useSettingsSecrets();
  const { mutate, isPending } = useUpdateSettings();
  const [showPass, setShowPass] = useState(false);

  const form = useForm<SmtpFormValues>({
    resolver: zodResolver(smtpSchema),
    values: {
      smtp_email_user: secrets?.smtp_email_user || "",
      smtp_email_pass: secrets?.smtp_email_pass || "",
    },
  });

  function onSubmit(values: SmtpFormValues) {
    mutate(values);
  }

  if (isLoading) {
    return (
      <div className="rounded-3xl bg-white dark:bg-card p-6 border-none shadow-none space-y-4">
        <Skeleton className="h-6 w-40 rounded-xl" />
        <Skeleton className="h-4 w-64 rounded-xl" />
        <Skeleton className="h-10 w-full rounded-2xl" />
        <Skeleton className="h-10 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white dark:bg-card p-6 border-none shadow-none space-y-4">
      <div>
        <h2 className="text-base font-bold tracking-tight">Gmail SMTP</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Manage your Gmail SMTP credentials for sending transactional emails (OTP, notifications).</p>
      </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="smtp_email_user"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="your@gmail.com" {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">Leave empty to use the value from environment variables.</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="smtp_email_pass"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>App Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input type={showPass ? "text" : "password"} placeholder="Enter Gmail app password" {...field} />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <p className="text-xs text-muted-foreground">Leave empty to use the value from environment variables.</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending} className="rounded-full text-xs font-semibold">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </Form>
    </div>
  );
}
