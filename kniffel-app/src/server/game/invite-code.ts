import { randomInt } from "crypto";

import { prisma } from "@/lib/prisma";

const INVITE_CODE_LENGTH = 6;
const INVITE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MAX_INVITE_CODE_ATTEMPTS = 20;

type InviteCodeClient = Pick<typeof prisma, "game">;

export function generateInviteCode(): string {
  let code = "";

  for (let index = 0; index < INVITE_CODE_LENGTH; index += 1) {
    code += INVITE_CODE_ALPHABET[randomInt(INVITE_CODE_ALPHABET.length)];
  }

  return code;
}

export async function generateUniqueInviteCode(client: InviteCodeClient = prisma): Promise<string> {
  for (let attempt = 0; attempt < MAX_INVITE_CODE_ATTEMPTS; attempt += 1) {
    const inviteCode = generateInviteCode();
    const existingGame = await client.game.findUnique({
      select: {
        id: true
      },
      where: {
        inviteCode
      }
    });

    if (!existingGame) {
      return inviteCode;
    }
  }

  throw new Error("Invite-Code konnte nicht erzeugt werden.");
}
