import { NextResponse } from "next/server";

import { getCurrentUser } from "@/server/auth/session";
import { getSocialState } from "@/server/social/state";
import { achievementCategoryLabels } from "@/social/achievements";
import { calculateAchievements, calculatePlayerStats } from "@/social/stats";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
  }

  const socialState = await getSocialState();
  const userStats = calculatePlayerStats(socialState.games, user.id);
  const achievements = calculateAchievements(userStats)
    .filter((achievement) => achievement.earned)
    .map((achievement) => ({
      categoryLabel: achievementCategoryLabels[achievement.category],
      description: achievement.description,
      id: achievement.id,
      label: achievement.label,
      rarity: achievement.rarity
    }));

  return NextResponse.json({ achievements });
}
