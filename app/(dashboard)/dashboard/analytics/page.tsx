import { Metadata } from "next";
import AnalysisClientPage from "./analysis-client";

export const metadata: Metadata = {
  title: "Analysis - Dashboard",
  description: "Track traffic activity, events, and business analytics",
};

export default function AnalysisPage() {
  return <AnalysisClientPage />;
}
