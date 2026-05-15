"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { clearSession, createSession } from "@/server/auth/session";
import { validateLoginForm, validateRegisterForm } from "@/server/auth/validation";

function redirectWithError(path: string, error: string): never {
  const separator = path.includes("?") ? "&" : "?";

  redirect(`${path}${separator}error=${encodeURIComponent(error)}`);
}

function readString(formData: FormData, name: string): string {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

function readRedirectTo(formData: FormData): string {
  const redirectTo = readString(formData, "redirectTo");

  return redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/dashboard";
}

export async function registerAction(formData: FormData): Promise<void> {
  const validation = validateRegisterForm(formData);

  if (!validation.ok) {
    redirectWithError("/register", validation.error);
  }

  const { email, password, username } = validation.data;

  const existingUser = await prisma.user.findFirst({
    select: {
      email: true,
      username: true
    },
    where: {
      OR: [{ email }, { username }]
    }
  });

  if (existingUser?.email === email) {
    redirectWithError("/register", "Diese E-Mail-Adresse ist bereits vergeben.");
  }

  if (existingUser?.username === username) {
    redirectWithError("/register", "Dieser Username ist bereits vergeben.");
  }

  try {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
        username
      },
      select: {
        id: true
      }
    });

    await createSession(user.id);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirectWithError("/register", "Username oder E-Mail ist bereits vergeben.");
    }

    redirectWithError("/register", "Registrierung fehlgeschlagen. Bitte erneut versuchen.");
  }

  redirect("/dashboard");
}

export async function loginAction(formData: FormData): Promise<void> {
  const redirectTo = readRedirectTo(formData);
  const loginPath = `/login?redirectTo=${encodeURIComponent(redirectTo)}`;
  const validation = validateLoginForm(formData);

  if (!validation.ok) {
    redirectWithError(loginPath, validation.error);
  }

  const { login, password } = validation.data;
  const normalizedLogin = login.toLowerCase();

  const user = await prisma.user.findFirst({
    select: {
      id: true,
      passwordHash: true
    },
    where: {
      OR: [{ email: normalizedLogin }, { username: normalizedLogin }]
    }
  });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    redirectWithError(loginPath, "Login-Daten sind ungueltig.");
  }

  await createSession(user.id);
  redirect(redirectTo);
}

export async function logoutAction(): Promise<void> {
  await clearSession();
  redirect("/login");
}
