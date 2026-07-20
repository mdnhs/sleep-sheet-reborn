"use client";

import { Globe } from "lucide-react";
import { WebsiteForm } from "@/features/settings/components/website-form";

export function WebsiteClient() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-4 md:pt-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Website Settings</h1>
        <p className="text-muted-foreground text-sm">
          Configure homepage hero, features, newsletter, footer, and site-wide content
        </p>
      </div>
      <WebsiteForm />
    </div>
  );
}
