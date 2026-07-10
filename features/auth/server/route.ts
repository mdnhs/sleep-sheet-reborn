import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { LoginSchema, RegisterSchema, ResetPasswordSchema } from "../schema";
import Jwt from "jsonwebtoken";
import { deleteCookie, setCookie } from "hono/cookie";

import bcrypt from "bcryptjs"; 
import { db } from "@/db";
import { users, otpVerifications, OTPType } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { AUTH_COOKIE } from "../constants";
import { sessionMiddleware } from "@/lib/session-middleware";
import { randomBytes } from "crypto";
import { addMinutes } from "date-fns";
import { sendEmail } from "@/lib/email";
import { z } from "zod";

const generateOtpCode = (length: number = 6): string => {
  const digits = randomBytes(length);
  return Array.from(digits).map(b => b % 10).join('');
};

const app = new Hono()
.get("/current",
    sessionMiddleware,
    (c)=>{
    const user = c.get("user");

    return c.json({data:user});
})
  .post("/register", zValidator("json", RegisterSchema), async (c) => {
    const { name, email, password } = c.req.valid("json");

    try {
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (existingUser) {
        return c.json({ error: "User already exists" }, 409);
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const [user] = await db.insert(users).values({
        name,
        email,
        password: hashedPassword,
      }).returning();

      return c.json(user, 201);
    } catch (error) {
      console.error("Error during registration", error);
      return c.json({ error: "Internal Server Error" }, 500);
    }
  })
  .post("/login", zValidator("json", LoginSchema), async (c) => {
    const { email, password } = c.req.valid("json");
  
    try {
      const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  
      if (!user || !user.password) {
        return c.json({ error: "Invalid credentials" }, 401);
      }
  
      const isValid = await bcrypt.compare(password, user.password);
  
      if (!isValid) {
        return c.json({ error: "Invalid credentials" }, 401);
      }
  
      const token = Jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );
  
      setCookie(c, AUTH_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
  
      return c.json({
        message: "Logged in successfully",
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.email === process.env.SUPER_ADMIN_EMAIL ? "ADMIN" : user.role,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      return c.json({ error: "Internal Server Error" }, 500);
    }
  })  
  .post("/logout", sessionMiddleware, async (c) => {
    deleteCookie(c, AUTH_COOKIE, {
      path: "/",
    });

    c.set("user", null);
  
    return c.json({ success: true, message: "Logged out successfully" });
  })


.post(
  '/otp/generate',
  zValidator(
    'json',
    z.object({
      email: z.string().email(),
      type: z.nativeEnum(OTPType),
    })
  ),
  async (c) => {
    const { email, type } = c.req.valid('json');

    try {
      let user = null;

      const shouldCheckUser = [OTPType.LOGIN_OTP, OTPType.PASSWORD_RESET].includes(type as any);
      if (shouldCheckUser) {
        user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!user) {
          return c.json({ error: 'User not found' }, 404);
        }
      }

      const existingOtp = await db.query.otpVerifications.findFirst({
        where: and(
          eq(otpVerifications.email, email),
          eq(otpVerifications.type, type),
          eq(otpVerifications.verified, false),
          gt(otpVerifications.expiresAt, new Date())
        ),
        orderBy: (fields, { desc }) => [desc(fields.createdAt)],
      });

      if (existingOtp) {
        const now = new Date();
        const remainingMs = existingOtp.expiresAt.getTime() - now.getTime();
        const remainingSec = Math.ceil(remainingMs / 1000);

        return c.json({
          error: `OTP already sent. Please wait ${remainingSec} seconds before requesting again.`,
          remainingSeconds: remainingSec,
        }, 429);
      }

      const otpCode = generateOtpCode();
      const expiresAt = addMinutes(new Date(), 5);

      await db.insert(otpVerifications).values({
        userId: shouldCheckUser ? user?.id : null,
        email,
        code: otpCode,
        type,
        expiresAt,
      });

      await sendEmail({
        to: email,
        subject: 'Your OTP Code',
        otp: otpCode,
    
      });

      return c.json({ message: 'OTP sent successfully' });
    } catch (error) {
      console.error('Error generating OTP:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
)


.post(
  '/otp/verify',
  zValidator('json', z.object({
    email: z.string().email(),
    otpCode: z.string(),
  })),
  async (c) => {
    const { email, otpCode } = c.req.valid('json');

    try {
      const otpVerification = await db.query.otpVerifications.findFirst({
        where: and(
          eq(otpVerifications.email, email),
          eq(otpVerifications.code, otpCode),
          eq(otpVerifications.verified, false)
        ),
      });

      if (!otpVerification) {
        return c.json({ error: 'Invalid or expired OTP' }, 400);
      }

      if (new Date() > otpVerification.expiresAt) {
        return c.json({ error: 'OTP has expired' }, 400);
      }

  
      await db.update(otpVerifications)
        .set({ verified: true })
        .where(eq(otpVerifications.id, otpVerification.id));

      return c.json({ message: 'OTP verified successfully' }, 200);
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
)
.post(
  "/reset-password",
  zValidator("json", ResetPasswordSchema),
  async (c) => {
    const { email, otpCode, newPassword } = c.req.valid("json");

    try {
      const otpVerification = await db.query.otpVerifications.findFirst({
        where: and(
          eq(otpVerifications.email, email),
          eq(otpVerifications.code, otpCode),
          eq(otpVerifications.type, OTPType.PASSWORD_RESET),
          eq(otpVerifications.verified, true),
          gt(otpVerifications.expiresAt, new Date())
        ),
      });

      if (!otpVerification) {
        return c.json({ error: "Invalid or expired OTP" }, 400);
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const [user] = await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.email, email))
        .returning();

      return c.json({ message: "Password reset successfully", userId: user.id });
    } catch (error) {
      console.error("Password reset error:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  }
)



  

.patch(
  "/profile",
  sessionMiddleware,
  zValidator(
    "json",
    z.object({
      name: z.string().min(1).optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      currentPassword: z.string().optional(),
      newPassword: z.string().min(6).optional(),
    })
  ),
  async (c) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const body = c.req.valid("json");

    const updateData: Record<string, any> = {};
    if (body.name) updateData.name = body.name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.address !== undefined) updateData.address = body.address;

    if (body.newPassword) {
      if (!body.currentPassword) {
        return c.json({ error: "Current password required" }, 400);
      }
      const dbUser = await db.query.users.findFirst({ where: eq(users.id, user.id) });
      if (!dbUser) return c.json({ error: "User not found" }, 404);
      const valid = await bcrypt.compare(body.currentPassword, dbUser.password);
      if (!valid) return c.json({ error: "Current password is incorrect" }, 400);
      updateData.password = await bcrypt.hash(body.newPassword, 10);
    }

    const [updated] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, user.id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        address: users.address,
        role: users.role,
      });

    return c.json({ data: updated });
  }
)

export default app;
