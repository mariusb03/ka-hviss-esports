import type { VercelRequest, VercelResponse } from "@vercel/node";

const PLAYERS = [
  {
    name: "Brotato",
    steamId: "76561198285667407",
  },
  {
    name: "Selnes",
    steamId: "76561198815099525",
  },
  {
    name: "Toonga",
    steamId: "76561198170149487",
  },
  {
    name: "Ewan M+cgregor",
    steamId: "76561198176454129",
  },
];

type TeamScore = {
  team_number: number;
  score: number;
};

type PlayerStats = {
  steam64_id: string;
  name: string;
  initial_team_number: number;

  total_kills: number;
  total_deaths: number;
  total_assists: number;
  total_hs_kills: number;

  kd_ratio: number;
  leetify_rating: number;
};

type LeetifyMatch = {
  id: string;
  finished_at: string;

  data_source: string;
  data_source_match_id: string;

  map_name: string;
  has_banned_player: boolean;

  team_scores: TeamScore[];
  stats: PlayerStats[];
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    const apiKey = process.env.LEETIFY_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "LEETIFY_API_KEY is missing",
      });
    }

    const requests = await Promise.allSettled(
      PLAYERS.map(async (player) => {
        const response = await fetch(
          `https://api-public.cs-prod.leetify.com/v3/profile/matches?steam64_id=${player.steamId}`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch matches for ${player.name}: ${response.status}`,
          );
        }

        return (await response.json()) as LeetifyMatch[];
      }),
    );

    const successfulResults = requests
      .filter(
        (
          result,
        ): result is PromiseFulfilledResult<LeetifyMatch[]> =>
          result.status === "fulfilled",
      )
      .map((result) => result.value);

    if (successfulResults.length === 0) {
      return res.status(502).json({
        error: "Could not fetch matches from Leetify",
      });
    }

    const allMatches = successfulResults.flat();

    const groupedMatches = new Map<string, LeetifyMatch>();

    for (const match of allMatches) {
      const matchKey =
        match.data_source_match_id || match.id;

      const existingMatch =
        groupedMatches.get(matchKey);

      if (!existingMatch) {
        groupedMatches.set(matchKey, {
          ...match,
          stats: [...match.stats],
        });

        continue;
      }

      for (const playerStats of match.stats) {
        const alreadyExists =
          existingMatch.stats.some(
            (existingPlayer) =>
              existingPlayer.steam64_id ===
              playerStats.steam64_id,
          );

        if (!alreadyExists) {
          existingMatch.stats.push(playerStats);
        }
      }
    }

    const matches = Array.from(
      groupedMatches.values(),
    )
      .sort(
        (a, b) =>
          new Date(b.finished_at).getTime() -
          new Date(a.finished_at).getTime(),
      )
      .slice(0, 60);

    return res.status(200).json(matches);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Something went wrong",
    });
  }
}