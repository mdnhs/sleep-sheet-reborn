"use client";

import { Search } from "lucide-react";
import { SeoForm } from "@/features/seo/components/seo-form";

export function SeoClient() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Search className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">SEO Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage search engine optimization, social sharing, and crawler settings
          </p>
        </div>
      </div>
      <SeoForm />
    </div>
  );
}
