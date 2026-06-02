"use client";

import dynamic from "next/dynamic";

const SignUpCard = dynamic(() => import("@/features/auth/components/sign-up-card"), {
  ssr: false,
});

export default function SignUpClientLoader() {
  return <SignUpCard />;
}
