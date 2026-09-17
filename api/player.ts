import type {
  VercelRequest,
  VercelResponse,
} from "@vercel/node";

const ALLOWED_PLAYERS = new Set([
  "76561198285667407",
  "76561198815099525",
  "76561198170149487",
  "76561198176454129",
  "76561198297944771",
  "76561198390883769",
  "76561198171470569",
]);

const LEETIFY_BASE_URL =
  "https://api-public.cs-prod.leetify.com";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    const steamId =
      typeof req.query.steamId === "string"
        ? req.query.steamId
        : "";

    if (!steamId || !ALLOWED_PLAYERS.has(steamId)) {
      return res.status(400).json({
        error: "Invalid player",
      });
    }

    const apiKey =
      process.env.LEETIFY_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "LEETIFY_API_KEY is missing",
      });
    }

    const headers = {
      Authorization: `Bearer ${apiKey}`,
    };

    const [
      profileResponse,
      matchesResponse,
    ] = await Promise.all([
      fetch(
        `${LEETIFY_BASE_URL}/v3/profile?steam64_id=${steamId}`,
        {
          headers,
        },
      ),

      fetch(
        `${LEETIFY_BASE_URL}/v3/profile/matches?steam64_id=${steamId}`,
        {
          headers,
        },
      ),
    ]);

    if (!matchesResponse.ok) {
      return res.status(
        matchesResponse.status,
      ).json({
        error:
          "Could not load player matches",
      });
    }

    const matches =
      await matchesResponse.json();

    /*
     * We don't want a failed profile request
     * to kill the match feed as well.
     */
    const profile = profileResponse.ok
      ? await profileResponse.json()
      : null;

    return res.status(200).json({
      profile,
      matches,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Something went wrong",
    });
  }
}