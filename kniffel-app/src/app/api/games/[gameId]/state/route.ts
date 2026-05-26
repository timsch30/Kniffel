import { NextResponse } from "next/server";

import { getCurrentUser } from "@/server/auth/session";
import { getGameState } from "@/server/game/state";

export const dynamic = "force-dynamic";

type GameStateRouteProps = {
  params: Promise<{
    gameId: string;
  }>;
};

export async function GET(request: Request, { params }: GameStateRouteProps) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
  }

  const { gameId } = await params;
  const state = await getGameState(gameId, user.id);

  if (!state) {
    return NextResponse.json({ error: "Runde nicht gefunden." }, { status: 404 });
  }

  const since = new URL(request.url).searchParams.get("since");

  if (since && since === state.updatedAt) {
    return new NextResponse(null, { status: 204 });
  }

  return NextResponse.json(state);
}
