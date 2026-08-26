import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { LoginSchema, RegisterSchema } from "../schema";
import Jwt from "jsonwebtoken";
import { deleteCookie, setCookie } from "hono/cookie";

import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AUTH_COOKIE } from "../constants";
import { sessionMiddleware, invalidateSessionUser } from "@/lib/session-middleware";
import { z } from "zod";

// Brute-force lockout: after this many wrong passwords in a row, the account
// is locked for LOCKOUT_MINUTES. Counter resets on any successful login.
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

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

      if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
        const remainingMin = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
        return c.json(
          { error: `Too many failed attempts. Try again in ${remainingMin} minute${remainingMin === 1 ? "" : "s"}.` },
          423,
        );
      }

      const isValid = await bcrypt.compare(password, user.password);

      if (!isValid) {
        const attempts = user.failedLoginAttempts + 1;
        const lockingOut = attempts >= MAX_FAILED_ATTEMPTS;

        await db.update(users)
          .set(
            lockingOut
              ? { failedLoginAttempts: 0, lockedUntil: new Date(Date.now() + LOCKOUT_MINUTES * 60000) }
              : { failedLoginAttempts: attempts },
          )
          .where(eq(users.id, user.id));

        if (lockingOut) {
          return c.json(
            { error: `Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes.` },
            423,
          );
        }
        return c.json({ error: "Invalid credentials" }, 401);
      }

      // Successful login clears any prior failed-attempt count.
      if (user.failedLoginAttempts > 0 || user.lockedUntil) {
        await db.update(users)
          .set({ failedLoginAttempts: 0, lockedUntil: null })
          .where(eq(users.id, user.id));
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

    // Cached session copies name/phone/address, so refresh it after an edit.
    invalidateSessionUser(user.id);

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
