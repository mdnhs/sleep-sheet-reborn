"use client";

import { Mail } from "lucide-react";
import { SmtpForm } from "@/features/settings/components/smtp-form";

export function SmtpClient() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-4 md:pt-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">SMTP Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage Gmail SMTP credentials for sending transactional emails
        </p>
      </div>
      <SmtpForm />
    </div>
  );
}
