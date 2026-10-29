"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export type RegisterState = { error?: string };

export async function registerUser(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const name = String(formData.get("name") ?? "").trim();
  const emailRaw = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !emailRaw || !password) {
    return { error: "All fields are required." };
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailRaw)) {
    return { error: "Please enter a valid email address." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const existing = await prisma.user.findUnique({ where: { email: emailRaw } });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  await prisma.user.create({
    data: {
      name,
      email: emailRaw,
      passwordHash: await bcrypt.hash(password, 10),
    },
  });

  redirect("/login?registered=1");
}
