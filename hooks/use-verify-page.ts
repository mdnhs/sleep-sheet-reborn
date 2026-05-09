
import { usePathname } from "next/navigation";

export function useIsVerifyOtpPage() {
  const pathname = usePathname();
  return pathname === "/verify-otp";
}