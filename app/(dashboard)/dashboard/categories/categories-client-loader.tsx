"use client";

import dynamic from "next/dynamic";

const CategoriesClientPage = dynamic(() => import("./categories-client"), {
  ssr: false,
});

export default function CategoriesClientLoader() {
  return <CategoriesClientPage />;
}
