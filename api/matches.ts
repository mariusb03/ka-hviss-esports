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
];

type LeetifyMatch = {
  id: string;
  finished_at: string;
  data_source: string;
  data_source_match_id: string;
  map_name: string;
  has_banned_player: boolean;
  team_scores: {
    team_number: number;
    score: number;
  }[];
  stats: {
    steam64_id: string;
    name: string;
    initial_team_number: number;
    total_kills: number;
    total_deaths: number;
    total_assists: number;
    total_hs_kills: number;
    kd_ratio: number;
    leetify_rating: number;
  }[];
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const apiKey = process.env.LEETIFY_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "LEETIFY_API_KEY is missing",
      });
    }

    const results = await Promise.all(
      PLAYERS.map(async (player) => {
        const response = await fetch(
          `https://api-public.cs-prod.leetify.com/v3/profile/matches?steam64_id=${player.steamId}`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch matches for ${player.name}: ${response.status}`
          );
        }

        return (await response.json()) as LeetifyMatch[];
      })
    );

    const allMatches = results.flat();

    const groupedMatches = new Map<string, LeetifyMatch>();

    for (const match of allMatches) {
      const matchKey = match.data_source_match_id || match.id;

      const existing = groupedMatches.get(matchKey);

      if (!existing) {
        groupedMatches.set(matchKey, {
          ...match,
          stats: [...match.stats],
        });

        continue;
      }

      for (const stat of match.stats) {
        const alreadyExists = existing.stats.some(
          (existingStat) =>
            existingStat.steam64_id === stat.steam64_id
        );

        if (!alreadyExists) {
          existing.stats.push(stat);
        }
      }
    }

    const matches = Array.from(groupedMatches.values())
      .sort(
        (a, b) =>
          new Date(b.finished_at).getTime() -
          new Date(a.finished_at).getTime()
      )
      .slice(0, 10);

    return res.status(200).json(matches);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Something went wrong",
    });
  }
}