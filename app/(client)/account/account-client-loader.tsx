"use client";

import dynamic from "next/dynamic";

const AccountClientPage = dynamic(() => import("./account-client"), {
  ssr: false,
});

export default function AccountClientLoader({ name }: { name: string }) {
  return <AccountClientPage name={name} />;
}
