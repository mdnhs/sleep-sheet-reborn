import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { deleteCookie, setCookie } from "hono/cookie";
import { LoginSchema, RegisterSchema, ResetPasswordSchema } from "./auth.schema";
import { AUTH_COOKIE } from "@repo/shared";
import { sessionMiddleware } from "../middleware/session";
import { isServiceError } from "../utils/service-error";
import { OTPType } from "@repo/types";
import * as auth from "../services/auth.service";

const app = new Hono()

  .get("/current", sessionMiddleware, (c) => {
    return c.json({ data: c.get("user") });
  })

  .post("/register", zValidator("json", RegisterSchema), async (c) => {
    try {
      const user = await auth.registerUser(c.req.valid("json"));
      return c.json(user, 201);
    } catch (error) {
      if (isServiceError(error)) return c.json({ error: error.message }, error.status);
      console.error("Error during registration", error);
      return c.json({ error: "Internal Server Error" }, 500);
    }
  })

  .post("/login", zValidator("json", LoginSchema), async (c) => {
    try {
      const { token, user } = await auth.loginUser(c.req.valid("json"));
      setCookie(c, AUTH_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      return c.json({ message: "Logged in successfully", token, user });
    } catch (error) {
      if (isServiceError(error)) return c.json({ error: error.message }, error.status);
      console.error("Login error:", error);
      return c.json({ error: "Internal Server Error" }, 500);
    }
  })

  .post("/logout", sessionMiddleware, async (c) => {
    deleteCookie(c, AUTH_COOKIE, { path: "/" });
    c.set("user", null);
    return c.json({ success: true, message: "Logged out successfully" });
  })

  .post(
    "/otp/generate",
    zValidator("json", z.object({ email: z.string().email(), type: z.nativeEnum(OTPType) })),
    async (c) => {
      try {
        return c.json(await auth.generateOtp(c.req.valid("json")));
      } catch (error) {
        if (isServiceError(error)) return c.json({ error: error.message }, error.status);
        console.error("Error generating OTP:", error);
        return c.json({ error: "Internal server error" }, 500);
      }
    },
  )

  .post(
    "/otp/verify",
    zValidator("json", z.object({ email: z.string().email(), otpCode: z.string() })),
    async (c) => {
      try {
        return c.json(await auth.verifyOtp(c.req.valid("json")), 200);
      } catch (error) {
        if (isServiceError(error)) return c.json({ error: error.message }, error.status);
        console.error("Error verifying OTP:", error);
        return c.json({ error: "Internal server error" }, 500);
      }
    },
  )

  .post("/reset-password", zValidator("json", ResetPasswordSchema), async (c) => {
    try {
      return c.json(await auth.resetPassword(c.req.valid("json")));
    } catch (error) {
      if (isServiceError(error)) return c.json({ error: error.message }, error.status);
      console.error("Password reset error:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  })

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
      }),
    ),
    async (c) => {
      const user = c.get("user");
      if (!user) return c.json({ error: "Unauthorized" }, 401);
      try {
        const data = await auth.updateProfile(user.id, c.req.valid("json"));
        return c.json({ data });
      } catch (error) {
        if (isServiceError(error)) return c.json({ error: error.message }, error.status);
        console.error("Profile update error:", error);
        return c.json({ error: "Internal server error" }, 500);
      }
    },
  );

export default app;
