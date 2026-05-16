import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth/session";

export async function POST() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
  }

  await prisma.user.update({
    data: {
      lastSeenAt: new Date()
    },
    where: {
      id: user.id
    }
  });

  return NextResponse.json({ ok: true });
}
