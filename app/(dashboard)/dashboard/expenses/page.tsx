import { Metadata } from "next";
import ExpensesClientPage from "./expenses-client";

export const metadata: Metadata = {
  title: "Expenses - Dashboard",
  description: "Manage your expenses and categories",
};

export default function ExpensesPage() {
  return <ExpensesClientPage />;
}
