import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type { Player } from "../data/players";

import "./PlayerProfile.css";

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

  dpr?: number;
  reaction_time?: number;
};

type Match = {
  id: string;

  finished_at: string;
  data_source: string;
  map_name: string;

  team_scores: TeamScore[];
  stats: PlayerStats[];
};

type PlayerApiResponse = {
  profile: unknown;
  matches: Match[];
};

type PlayerProfileProps = {
  player: Player;
};

function formatMapName(mapName: string) {
  return mapName
    .replace("de_", "")
    .replace("cs_", "")
    .toUpperCase();
}

function formatGameMode(dataSource: string) {
  switch (dataSource) {
    case "matchmaking":
      return "PREMIER";

    case "matchmaking_competitive":
      return "COMPETITIVE";

    default:
      return dataSource
        .replaceAll("_", " ")
        .toUpperCase();
  }
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("no-NO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatRating(rating: number) {
  const value = rating * 100;

  return `${value > 0 ? "+" : ""}${value.toFixed(1)}`;
}

function getPlayerStats(
  match: Match,
  steamId: string,
) {
  return match.stats.find(
    (stats) => stats.steam64_id === steamId,
  );
}

function getMatchResult(
  match: Match,
  steamId: string,
) {
  const stats = getPlayerStats(match, steamId);

  if (!stats) {
    return {
      result: "DRAW",
      playerScore: 0,
      opponentScore: 0,
    };
  }

  const playerTeam = match.team_scores.find(
    (team) =>
      team.team_number === stats.initial_team_number,
  );

  const opponentTeam = match.team_scores.find(
    (team) =>
      team.team_number !== stats.initial_team_number,
  );

  const playerScore = playerTeam?.score ?? 0;
  const opponentScore = opponentTeam?.score ?? 0;

  return {
    result:
      playerScore > opponentScore
        ? "WIN"
        : playerScore < opponentScore
          ? "LOSS"
          : "DRAW",

    playerScore,
    opponentScore,
  };
}

function PlayerProfile({
  player,
}: PlayerProfileProps) {
  const [data, setData] =
    useState<PlayerApiResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPlayer() {
      setLoading(true);
      setError(false);

      try {
        const response = await fetch(
          `/api/player?steamId=${player.steamId}`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(
            "Could not load player profile",
          );
        }

        const result =
          (await response.json()) as PlayerApiResponse;

        setData(result);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        console.error(error);
        setError(true);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadPlayer();

    return () => controller.abort();
  }, [player.steamId]);

  const recentMatches =
    data?.matches.slice(0, 10) ?? [];

  const summary = useMemo(() => {
    if (recentMatches.length === 0) {
      return {
        matches: 0,
        wins: 0,
        losses: 0,
        kd: 0,
        hsPercentage: 0,
        rating: 0,
        damagePerRound: 0,
      };
    }

    let wins = 0;
    let losses = 0;

    let kills = 0;
    let deaths = 0;
    let headshots = 0;

    let ratingTotal = 0;
    let ratingCount = 0;

    let damageTotal = 0;
    let damageCount = 0;

    for (const match of recentMatches) {
      const stats = getPlayerStats(
        match,
        player.steamId,
      );

      if (!stats) {
        continue;
      }

      const result = getMatchResult(
        match,
        player.steamId,
      );

      if (result.result === "WIN") {
        wins += 1;
      }

      if (result.result === "LOSS") {
        losses += 1;
      }

      kills += stats.total_kills;
      deaths += stats.total_deaths;
      headshots += stats.total_hs_kills;

      ratingTotal += stats.leetify_rating;
      ratingCount += 1;

      if (typeof stats.dpr === "number") {
        damageTotal += stats.dpr;
        damageCount += 1;
      }
    }

    return {
      matches: recentMatches.length,
      wins,
      losses,

      kd:
        deaths > 0
          ? kills / deaths
          : kills,

      hsPercentage:
        kills > 0
          ? (headshots / kills) * 100
          : 0,

      rating:
        ratingCount > 0
          ? ratingTotal / ratingCount
          : 0,

      damagePerRound:
        damageCount > 0
          ? damageTotal / damageCount
          : 0,
    };
  }, [recentMatches, player.steamId]);

  return (
    <div className="player-profile">
      <div className="player-profile__top">
        <div className="player-profile__identity">
          <div className="player-profile__image">
            <img
              src={player.image}
              alt={player.name}
            />
          </div>

          <div className="player-profile__title">
            <span>
              PLAYER / {player.number}
            </span>

            <h3>{player.name}</h3>

            <p>
              KA HVISS? / COUNTER-STRIKE 2
            </p>
          </div>
        </div>

        <div className="player-profile__live">
          <span className="player-profile__live-dot" />

          LIVE LEETIFY DATA
        </div>
      </div>

      {loading && (
        <div className="player-profile__state">
          <span>LOADING PLAYER DATA</span>

          <p>
            Consulting the statistics department...
          </p>
        </div>
      )}

      {error && (
        <div className="player-profile__state">
          <span>PROFILE UNAVAILABLE</span>

          <p>
            Leetify returned absolutely nothing useful.
          </p>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <div className="player-profile__section-header">
            <span>LEETIFY / RECENT FORM</span>

            <p>
              Based on the latest{" "}
              {summary.matches} matches.
            </p>
          </div>

          <div className="player-profile__stats">
            <div>
              <span>WINS</span>
              <strong>{summary.wins}</strong>
            </div>

            <div>
              <span>LOSSES</span>
              <strong>{summary.losses}</strong>
            </div>

            <div>
              <span>K/D</span>
              <strong>
                {summary.kd.toFixed(2)}
              </strong>
            </div>

            <div>
              <span>HEADSHOTS</span>
              <strong>
                {summary.hsPercentage.toFixed(0)}%
              </strong>
            </div>

            <div>
              <span>LEETIFY</span>
              <strong
                className={
                  summary.rating >= 0
                    ? "player-profile__positive"
                    : "player-profile__negative"
                }
              >
                {formatRating(summary.rating)}
              </strong>
            </div>

            <div>
              <span>DMG / ROUND</span>
              <strong>
                {summary.damagePerRound > 0
                  ? summary.damagePerRound.toFixed(1)
                  : "—"}
              </strong>
            </div>
          </div>

          <div className="player-profile__section-header player-profile__section-header--matches">
            <span>RECENT MATCHES</span>

            <p>LAST 10</p>
          </div>

          <div className="player-profile__matches">
            {recentMatches.map((match) => {
              const stats = getPlayerStats(
                match,
                player.steamId,
              );

              if (!stats) {
                return null;
              }

              const {
                result,
                playerScore,
                opponentScore,
              } = getMatchResult(
                match,
                player.steamId,
              );

              return (
                <article
                  className="profile-match"
                  key={match.id}
                >
                  <div className="profile-match__top">
                    <div className="profile-match__badges">
                      <span
                        className={`profile-match__result profile-match__result--${result.toLowerCase()}`}
                      >
                        {result}
                      </span>

                      <span className="profile-match__mode">
                        {formatGameMode(
                          match.data_source,
                        )}
                      </span>
                    </div>

                    <span className="profile-match__date">
                      {formatDate(
                        match.finished_at,
                      )}
                    </span>
                  </div>

                  <div className="profile-match__main">
                    <div>
                      <span>MAP</span>

                      <h4>
                        {formatMapName(
                          match.map_name,
                        )}
                      </h4>
                    </div>

                    <div className="profile-match__score">
                      {playerScore}

                      <small>:</small>

                      {opponentScore}
                    </div>
                  </div>

                  <div className="profile-match__numbers">
                    <div>
                      <span>K</span>
                      <strong>
                        {stats.total_kills}
                      </strong>
                    </div>

                    <div>
                      <span>D</span>
                      <strong>
                        {stats.total_deaths}
                      </strong>
                    </div>

                    <div>
                      <span>A</span>
                      <strong>
                        {stats.total_assists}
                      </strong>
                    </div>

                    <div>
                      <span>K/D</span>
                      <strong>
                        {stats.kd_ratio.toFixed(2)}
                      </strong>
                    </div>

                    <div>
                      <span>RATING</span>
                      <strong
                        className={
                          stats.leetify_rating >= 0
                            ? "player-profile__positive"
                            : "player-profile__negative"
                        }
                      >
                        {formatRating(
                          stats.leetify_rating,
                        )}
                      </strong>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="player-profile__credit">
            DATA PROVIDED BY LEETIFY
          </div>
        </>
      )}
    </div>
  );
}

export default PlayerProfile;