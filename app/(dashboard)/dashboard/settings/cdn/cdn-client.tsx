"use client";

import { Image } from "lucide-react";
import { CdnForm } from "@/features/settings/components/cdn-form";

export function CdnClient() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-4 md:pt-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">CDN Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage Cloudinary API credentials for image uploads and storage
        </p>
      </div>
      <CdnForm />
    </div>
  );
}
