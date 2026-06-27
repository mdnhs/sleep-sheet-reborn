"use client";

import { Image } from "lucide-react";
import { CdnForm } from "@/features/settings/components/cdn-form";

export function CdnClient() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Image className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">CDN Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage Cloudinary API credentials for image uploads and storage
          </p>
        </div>
      </div>
      <CdnForm />
    </div>
  );
}
