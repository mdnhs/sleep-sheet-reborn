"use client";

import { Mail } from "lucide-react";
import { SmtpForm } from "@/features/settings/components/smtp-form";

export function SmtpClient() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Mail className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">SMTP Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage Gmail SMTP credentials for sending transactional emails
          </p>
        </div>
      </div>
      <SmtpForm />
    </div>
  );
}
