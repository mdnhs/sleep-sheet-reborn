"use client";

import dynamic from "next/dynamic";

const SignInCard = dynamic(() => import("@/features/auth/components/sign-in-card"), {
  ssr: false,
});

export default function SignInClientLoader() {
  return <SignInCard />;
}
