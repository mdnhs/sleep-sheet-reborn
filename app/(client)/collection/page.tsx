import type { Metadata } from "next";
import { generateMetadata as buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Collections",
  description: "Browse our curated collections of bedding and sleep essentials.",
  canonical: "/collection",
});

function CollectionPage() {
  return <div>CollectionPage</div>;
}

export default CollectionPage;
