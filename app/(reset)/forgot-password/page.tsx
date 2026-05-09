"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  OTPType,
  setForgotPassword,
} from "@/features/auth/state/forgot-password-slice";

import { useAppDispatch } from "@/store/hooks";
import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

function ForgotPassword() {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState("");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    dispatch(
      setForgotPassword({ email: email, purpose: OTPType.PASSWORD_RESET })
    );
    router.push("/verify");
  };

  return (
    <div className="max-w-md mx-auto p-6 rounded-lg border border-border bg-card">
      <Link href="/signin">
        <label className="flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to login
        </label>
      </Link>
      <h2 className="text-2xl font-bold mb-4 text-center">
        Reset Your Password
      </h2>

      <p className="text-muted-foreground mb-6 text-center">
        Enter your email address and we'll send you a verification code to reset
        your password.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              placeholder="your.email@example.com"
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full py-6" disabled={isSubmitting}>
          {isSubmitting ? "Sending OTP..." : "Send Verification Code"}
        </Button>
      </form>
    </div>
  );
}

export default ForgotPassword;
