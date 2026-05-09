// lib/auth.ts
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { AUTH_COOKIE } from "@/features/auth/constants";

export async function getCurrentUser() {
  const cookieStore = cookies();
  const token = (await cookieStore).get(AUTH_COOKIE)?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
      role:string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}
