import Jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { addMinutes } from "date-fns";
import db from "@/lib/db";
import { OTPType } from "@/lib/enums";
import { sendEmail } from "@/lib/email";
import { ServiceError } from "@/lib/service-error";

function generateOtpCode(length = 6): string {
  const digits = randomBytes(length);
  return Array.from(digits)
    .map((b) => b % 10)
    .join("");
}

export async function registerUser(input: { name: string; email: string; password: string }) {
  const existingUser = await db.user.findUnique({ where: { email: input.email } });
  if (existingUser) throw new ServiceError("User already exists", 409);

  const hashedPassword = await bcrypt.hash(input.password, 10);
  return db.user.create({
    data: { name: input.name, email: input.email, password: hashedPassword },
  });
}

export async function loginUser(input: { email: string; password: string }) {
  const user = await db.user.findUnique({ where: { email: input.email } });
  if (!user || !user.password) throw new ServiceError("Invalid credentials", 401);

  const isValid = await bcrypt.compare(input.password, user.password);
  if (!isValid) throw new ServiceError("Invalid credentials", 401);

  const token = Jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });

  return { token, user: { id: user.id, email: user.email, name: user.name } };
}

export async function generateOtp(input: { email: string; type: OTPType }) {
  const { email, type } = input;
  const shouldCheckUser = ([OTPType.LOGIN_OTP, OTPType.PASSWORD_RESET] as OTPType[]).includes(type);

  let user = null;
  if (shouldCheckUser) {
    user = await db.user.findUnique({ where: { email } });
    if (!user) throw new ServiceError("User not found", 404);
  }

  const existingOtp = await db.oTPVerification.findFirst({
    where: { email, type, verified: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (existingOtp) {
    const remainingSec = Math.ceil((existingOtp.expiresAt.getTime() - Date.now()) / 1000);
    throw new ServiceError(
      `OTP already sent. Please wait ${remainingSec} seconds before requesting again.`,
      429,
    );
  }

  const otpCode = generateOtpCode();
  await db.oTPVerification.create({
    data: {
      userId: shouldCheckUser ? user?.id : null,
      email,
      code: otpCode,
      type,
      expiresAt: addMinutes(new Date(), 5),
    },
  });

  await sendEmail({ to: email, subject: "Your OTP Code", otp: otpCode });

  return { message: "OTP sent successfully" };
}

export async function verifyOtp(input: { email: string; otpCode: string }) {
  const otpVerification = await db.oTPVerification.findFirst({
    where: { email: input.email, code: input.otpCode, verified: false },
  });

  if (!otpVerification) throw new ServiceError("Invalid or expired OTP");
  if (new Date() > otpVerification.expiresAt) throw new ServiceError("OTP has expired");

  await db.oTPVerification.update({
    where: { id: otpVerification.id },
    data: { verified: true },
  });

  return { message: "OTP verified successfully" };
}

export async function resetPassword(input: { email: string; otpCode: string; newPassword: string }) {
  const otpVerification = await db.oTPVerification.findFirst({
    where: {
      email: input.email,
      code: input.otpCode,
      type: OTPType.PASSWORD_RESET,
      verified: true,
      expiresAt: { gt: new Date() },
    },
  });

  if (!otpVerification) throw new ServiceError("Invalid or expired OTP");

  const hashedPassword = await bcrypt.hash(input.newPassword, 10);
  const user = await db.user.update({
    where: { email: input.email },
    data: { password: hashedPassword },
  });

  if (!user) throw new ServiceError("User not found", 404);

  return { message: "Password reset successfully", userId: user.id };
}

export async function updateProfile(
  userId: string,
  body: {
    name?: string;
    phone?: string;
    address?: string;
    currentPassword?: string;
    newPassword?: string;
  },
) {
  const updateData: Record<string, string> = {};
  if (body.name) updateData.name = body.name;
  if (body.phone !== undefined) updateData.phone = body.phone;
  if (body.address !== undefined) updateData.address = body.address;

  if (body.newPassword) {
    if (!body.currentPassword) throw new ServiceError("Current password required");
    const dbUser = await db.user.findUnique({ where: { id: userId } });
    if (!dbUser) throw new ServiceError("User not found", 404);
    const valid = await bcrypt.compare(body.currentPassword, dbUser.password);
    if (!valid) throw new ServiceError("Current password is incorrect");
    updateData.password = await bcrypt.hash(body.newPassword, 10);
  }

  return db.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, name: true, email: true, phone: true, address: true, role: true },
  });
}
