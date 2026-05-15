import { notFound } from "next/navigation";
import { headers } from "next/headers";

import { GameView } from "@/components/game/GameView";
import { PageContainer } from "@/components/layout/PageContainer";
import { requireCurrentUser } from "@/server/auth/session";
import {
  enterScoreAction,
  movePlayerAction,
  restartGameAction,
  startGameAction
} from "@/server/game/actions";
import { getGameState } from "@/server/game/state";

export const dynamic = "force-dynamic";

type GamePageProps = {
  params: Promise<{
    gameId: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function GamePage({ params, searchParams }: GamePageProps) {
  const user = await requireCurrentUser();
  const { gameId } = await params;
  const { error } = await searchParams;
  const initialState = await getGameState(gameId);

  if (!initialState) {
    notFound();
  }

  const joinPath = `/join/${encodeURIComponent(initialState.inviteCode)}`;
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const inviteLink = host ? `${protocol}://${host}${joinPath}` : joinPath;
  const boundStartGameAction = startGameAction.bind(null, initialState.gameId);
  const boundEnterScoreAction = enterScoreAction.bind(null, initialState.gameId);
  const boundMovePlayerAction = movePlayerAction.bind(null, initialState.gameId);
  const boundRestartGameAction = restartGameAction.bind(null, initialState.gameId);

  return (
    <PageContainer className="grid gap-4 sm:gap-5" size="xl">
      <GameView
        currentUserId={user.id}
        enterScoreAction={boundEnterScoreAction}
        error={error}
        initialState={initialState}
        inviteLink={inviteLink}
        movePlayerAction={boundMovePlayerAction}
        restartGameAction={boundRestartGameAction}
        startGameAction={boundStartGameAction}
      />
    </PageContainer>
  );
}
