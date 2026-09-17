import type {
  VercelRequest,
  VercelResponse,
} from "@vercel/node";

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
  {
    name: "Gutta",
    steamId: "76561198297944771",
  },
  {
    name: "PetterJY",
    steamId: "76561198390883769",
  },
  {
    name: "evgiS",
    steamId: "76561198171470569",
  },
];

type RecentMatch = {
  id: string;
  finished_at: string;
  data_source: string;
  outcome: string;
  rank: number;
  rank_type: number;
  map_name: string;
};

type ProfileResponse = {
  name: string;
  steam64_id: string;

  ranks?: {
    premier?: number | null;
  };

  recent_matches?: RecentMatch[];
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

    const results =
      await Promise.allSettled(
        PLAYERS.map(async (player) => {
          const response = await fetch(
            `https://api-public.cs-prod.leetify.com/v3/profile?steam64_id=${player.steamId}`,
            {
              headers: {
                Authorization: `Bearer ${apiKey}`,
              },
            },
          );

          if (!response.ok) {
            throw new Error(
              `Could not fetch ${player.name}`,
            );
          }

          const profile =
            (await response.json()) as ProfileResponse;

          const history = (
            profile.recent_matches ?? []
          )
            .filter(
              (match) =>
                match.rank_type === 11 &&
                match.rank > 0,
            )
            .map((match) => ({
              id: match.id,
              date: match.finished_at,
              rating: match.rank,
              outcome: match.outcome,
              mapName: match.map_name,
            }))
            .sort(
              (a, b) =>
                new Date(a.date).getTime() -
                new Date(b.date).getTime(),
            );

          return {
            name: player.name,
            steamId: player.steamId,
            currentRating:
              profile.ranks?.premier ?? null,
            history,
          };
        }),
      );

    const players = results
      .filter(
        (
          result,
        ): result is PromiseFulfilledResult<{
          name: string;
          steamId: string;
          currentRating: number | null;
          history: {
            id: string;
            date: string;
            rating: number;
            outcome: string;
            mapName: string;
          }[];
        }> => result.status === "fulfilled",
      )
      .map((result) => result.value);

    return res.status(200).json({
      players,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Something went wrong",
    });
  }
}