"use client";

import { Globe } from "lucide-react";
import { WebsiteForm } from "@/features/settings/components/website-form";

export function WebsiteClient() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Globe className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Website Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure homepage hero, features, newsletter, footer, and other site-wide content.
          </p>
        </div>
      </div>
      <WebsiteForm />
    </div>
  );
}
