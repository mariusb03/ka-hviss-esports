import type {
  VercelRequest,
  VercelResponse,
} from "@vercel/node";

const PLAYERS = [
  "76561198285667407",
  "76561198815099525",
  "76561198170149487",
  "76561198176454129",
  "76561198297944771",
  "76561198390883769",
  "76561198171470569",
];

const PLAYER_IDS = new Set(PLAYERS);

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

  team_scores: TeamScore[];
  stats: PlayerStats[];
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    const apiKey =
      process.env.LEETIFY_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "LEETIFY_API_KEY is missing",
      });
    }

    const requests =
      await Promise.allSettled(
        PLAYERS.map(async (steamId) => {
          const response = await fetch(
            `https://api-public.cs-prod.leetify.com/v3/profile/matches?steam64_id=${steamId}`,
            {
              headers: {
                Authorization: `Bearer ${apiKey}`,
              },
            },
          );

          if (!response.ok) {
            throw new Error(
              `Failed to fetch ${steamId}`,
            );
          }

          return (await response.json()) as LeetifyMatch[];
        }),
      );

    const allMatches = requests
      .filter(
        (
          result,
        ): result is PromiseFulfilledResult<
          LeetifyMatch[]
        > =>
          result.status === "fulfilled",
      )
      .flatMap((result) => result.value);

    if (allMatches.length === 0) {
      return res.status(502).json({
        error:
          "Could not fetch matches from Leetify",
      });
    }

    const groupedMatches =
      new Map<string, LeetifyMatch>();

    for (const match of allMatches) {
      const key =
        match.data_source_match_id ||
        match.id;

      const existing =
        groupedMatches.get(key);

      if (!existing) {
        groupedMatches.set(key, {
          ...match,
          stats: [...match.stats],
        });

        continue;
      }

      for (const stats of match.stats) {
        const alreadyExists =
          existing.stats.some(
            (existingStats) =>
              existingStats.steam64_id ===
              stats.steam64_id,
          );

        if (!alreadyExists) {
          existing.stats.push(stats);
        }
      }
    }

    const teamMatches = Array.from(
      groupedMatches.values(),
    )
      .filter((match) => {
        const rosterPlayers =
          match.stats.filter((stats) =>
            PLAYER_IDS.has(
              stats.steam64_id,
            ),
          );

        return rosterPlayers.length >= 2;
      })
      .sort(
        (a, b) =>
          new Date(
            b.finished_at,
          ).getTime() -
          new Date(
            a.finished_at,
          ).getTime(),
      )
      .slice(0, 9);

    return res.status(200).json(teamMatches);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Something went wrong",
    });
  }
}