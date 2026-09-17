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

const PLAYER_IDS = new Set(
  PLAYERS.map((player) => player.steamId),
);

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

  cs_rating_before?: number | null;
  cs_rating_after?: number | null;
  cs_rating_change?: number | null;
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

type ProfileRecentMatch = {
  id: string;
  finished_at: string;

  data_source: string;
  outcome: string;

  rank: number;
  rank_type: number;

  map_name: string;
};

type ProfileResponse = {
  recent_matches?: ProfileRecentMatch[];
};

type PlayerResult = {
  matches: LeetifyMatch[];
  ratings: Map<
    string,
    {
      before: number | null;
      after: number;
      change: number | null;
    }
  >;
};

function buildRatingMap(
  matches: ProfileRecentMatch[],
) {
  const premierMatches = matches
    .filter(
      (match) =>
        match.rank_type === 11 &&
        match.rank > 0,
    )
    .sort(
      (a, b) =>
        new Date(b.finished_at).getTime() -
        new Date(a.finished_at).getTime(),
    );

  const ratings = new Map<
    string,
    {
      before: number | null;
      after: number;
      change: number | null;
    }
  >();

  premierMatches.forEach(
    (match, index) => {
      const olderMatch =
        premierMatches[index + 1];

      const before =
        olderMatch?.rank ?? null;

      ratings.set(match.id, {
        before,
        after: match.rank,

        change:
          before !== null
            ? match.rank - before
            : null,
      });
    },
  );

  return ratings;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    const apiKey =
      process.env.LEETIFY_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error:
          "LEETIFY_API_KEY is missing",
      });
    }

    const headers = {
      Authorization: `Bearer ${apiKey}`,
    };

    const requests =
      await Promise.allSettled(
        PLAYERS.map(async (player) => {
          const [
            profileResponse,
            matchesResponse,
          ] = await Promise.all([
            fetch(
              `https://api-public.cs-prod.leetify.com/v3/profile?steam64_id=${player.steamId}`,
              {
                headers,
              },
            ),

            fetch(
              `https://api-public.cs-prod.leetify.com/v3/profile/matches?steam64_id=${player.steamId}`,
              {
                headers,
              },
            ),
          ]);

          if (!matchesResponse.ok) {
            throw new Error(
              `Could not fetch matches for ${player.name}`,
            );
          }

          const matches =
            (await matchesResponse.json()) as LeetifyMatch[];

          let ratings = new Map<
            string,
            {
              before: number | null;
              after: number;
              change: number | null;
            }
          >();

          if (profileResponse.ok) {
            const profile =
              (await profileResponse.json()) as ProfileResponse;

            ratings = buildRatingMap(
              profile.recent_matches ?? [],
            );
          }

          return {
            matches,
            ratings,
          } satisfies PlayerResult;
        }),
      );

    const successfulResults =
      requests.filter(
        (
          result,
        ): result is PromiseFulfilledResult<PlayerResult> =>
          result.status === "fulfilled",
      );

    if (
      successfulResults.length === 0
    ) {
      return res.status(502).json({
        error:
          "Could not fetch matches from Leetify",
      });
    }

    /*
     * Attach each player's CS Rating
     * data to their stats before merging
     * duplicate matches.
     */
    const enrichedMatches =
      successfulResults.flatMap(
        (result) =>
          result.value.matches.map(
            (match) => ({
              ...match,

              stats: match.stats.map(
                (stats) => {
                  const rating =
                    result.value.ratings.get(
                      match.id,
                    );

                  return {
                    ...stats,

                    cs_rating_before:
                      rating?.before ??
                      null,

                    cs_rating_after:
                      rating?.after ??
                      null,

                    cs_rating_change:
                      rating?.change ??
                      null,
                  };
                },
              ),
            }),
          ),
      );

    const groupedMatches =
      new Map<string, LeetifyMatch>();

    for (const match of enrichedMatches) {
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
        const existingStats =
          existing.stats.find(
            (existingPlayer) =>
              existingPlayer.steam64_id ===
              stats.steam64_id,
          );

        if (!existingStats) {
          existing.stats.push(stats);

          continue;
        }

        /*
         * Preserve rating information
         * if one copy contains it.
         */
        if (
          existingStats.cs_rating_after ==
            null &&
          stats.cs_rating_after != null
        ) {
          existingStats.cs_rating_before =
            stats.cs_rating_before;

          existingStats.cs_rating_after =
            stats.cs_rating_after;

          existingStats.cs_rating_change =
            stats.cs_rating_change;
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

        return (
          rosterPlayers.length >= 2
        );
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

    return res
      .status(200)
      .json(teamMatches);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Something went wrong",
    });
  }
}