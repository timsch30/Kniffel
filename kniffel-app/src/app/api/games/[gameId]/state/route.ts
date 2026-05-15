import { NextResponse } from "next/server";

import { getCurrentUser } from "@/server/auth/session";
import { getGameState } from "@/server/game/state";

export const dynamic = "force-dynamic";

type GameStateRouteProps = {
  params: Promise<{
    gameId: string;
  }>;
};

export async function GET(_request: Request, { params }: GameStateRouteProps) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
  }

  const { gameId } = await params;
  const state = await getGameState(gameId);

  if (!state) {
    return NextResponse.json({ error: "Runde nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json(state);
}
