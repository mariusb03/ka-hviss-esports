import type { VercelRequest, VercelResponse } from "@vercel/node";

const BROTATO_STEAM_ID = "76561198285667407";

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

    const response = await fetch(
      `https://api-public.cs-prod.leetify.com/v3/profile/matches?steam64_id=${BROTATO_STEAM_ID}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Leetify request failed",
        data,
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Something went wrong",
    });
  }
}