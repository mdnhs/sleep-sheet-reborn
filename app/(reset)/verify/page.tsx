"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { useGenerateOtp, useVerifyOtp } from "@/features/auth/api/use-otp";
import { useForgotPassword } from "@/features/auth/api/use-verify";
import { useRegister } from "@/features/auth/api/user-register";
import { OTPType } from "@/features/auth/state/forgot-password-slice";
import { useAppSelector } from "@/store/hooks";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

function OTPVerificationPage() {
  const { email: forgotEmail, purpose: forgotPurpose } = useAppSelector(
    (state) => state.forgotPassword,
  );
  const {
    email: registerEmail,
    name,
    password,
    purpose: registerPurpose,
  } = useAppSelector((state) => state.register);

  const purpose = forgotPurpose || registerPurpose;
  const userEmail = forgotEmail || registerEmail;

  const [otp, setOtp] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const otpLength = 6;

  const router = useRouter();
  const hasSentOtpRef = useRef(false);

  const { mutate: generateOtp } = useGenerateOtp();
  const { mutate: verifyOtp, isPending: isOtpVerifying } = useVerifyOtp();
  const { mutate: Register, isPending: isRegistering } = useRegister();
  const { mutate: resetPassword, isPending: isResetting } = useForgotPassword();

  useEffect(() => {
    if (userEmail && purpose && !hasSentOtpRef.current) {
      generateOtp({
        email: userEmail,
        type: purpose as "EMAIL_VERIFICATION" | "PASSWORD_RESET" | "LOGIN_OTP",
      });
      hasSentOtpRef.current = true;
    }
  }, [userEmail, purpose, generateOtp]);

  const handleVerify = () => {
    if (otp.length !== otpLength) {
      toast.error(`Invalid OTP. Please enter all ${otpLength} digits.`);
      return;
    }

    verifyOtp(
      {
        email: userEmail,
        otpCode: otp,
      },
      {
        onSuccess: () => {
          if (purpose === OTPType.PASSWORD_RESET) {
            toast.success("OTP Verified");
            setShowResetForm(true);
          }

          if (purpose === OTPType.EMAIL_VERIFICATION) {
            Register({
              json: {
                email: userEmail,
                name,
                password,
              },
            });
          }
        },
      },
    );
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    resetPassword(
      {
        email: userEmail,
        newPassword,
        otpCode: otp,
      },
      {
        onSuccess: () => {
          toast.success("Your password has been successfully reset.");
          router.push("/signin");
        },
      },
    );
  };

  const handleResendOtp = () => {
    hasSentOtpRef.current = false;
    setOtp("");

    if (userEmail && purpose) {
      generateOtp({
        email: userEmail,
        type: purpose as "EMAIL_VERIFICATION" | "PASSWORD_RESET" | "LOGIN_OTP",
      });
    }
  };

  return (
    <>
      <div className="container mx-auto px-4 py-12 max-w-md">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">
              {purpose === OTPType.PASSWORD_RESET
                ? "Reset Your Password"
                : "Verify Your Email"}
            </h1>
            <p className="text-muted-foreground mt-2">
              We've sent a verification code to
              <br />
              <span className="font-medium">{userEmail || "your email"}</span>
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Enter verification code
                </label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={otpLength}
                    value={otp}
                    onChange={(value) => setOtp(value)}
                  >
                    <InputOTPGroup>
                      {Array.from({ length: otpLength }).map((_, index) => (
                        <InputOTPSlot key={index} index={index} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleVerify}
                disabled={otp.length !== otpLength}
              >
                {isOtpVerifying
                  ? "Verifying..."
                  : purpose === OTPType.EMAIL_VERIFICATION && isRegistering
                    ? "Registering..."
                    : "Verify"}
              </Button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Didn't receive the code?{" "}
                  <button
                    onClick={handleResendOtp}
                    className="text-primary hover:text-primary/80 font-medium"
                    type="button"
                  >
                    Resend
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showResetForm} onOpenChange={setShowResetForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set New Password</DialogTitle>
            <DialogDescription>
              Enter your new password below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowResetForm(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isResetting}>
                {isResetting ? "Resetting..." : "Reset Password"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default OTPVerificationPage;
