import {
  useEffect,
  useState,
} from "react";

import { players } from "../data/players";

import "./Matches.css";

const PLAYER_IDS = players.map(
  (player) => player.steamId,
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
};

type Match = {
  id: string;

  finished_at: string;
  data_source: string;
  map_name: string;

  team_scores: TeamScore[];
  stats: PlayerStats[];
};

function formatMapName(mapName: string) {
  return mapName
    .replace("de_", "")
    .replace("cs_", "")
    .toUpperCase();
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("no-NO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
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

function formatRating(rating: number) {
  const value = rating * 100;

  return `${value > 0 ? "+" : ""}${value.toFixed(1)}`;
}

function getRosterPlayers(match: Match) {
  return match.stats.filter(
    (player) =>
      PLAYER_IDS.includes(
        player.steam64_id,
      ),
  );
}

function getMatchResult(match: Match) {
  const rosterPlayers =
    getRosterPlayers(match);

  const referencePlayer =
    rosterPlayers[0];

  if (!referencePlayer) {
    return {
      result: "DRAW",
      playerScore: 0,
      opponentScore: 0,
    };
  }

  const playerTeam =
    match.team_scores.find(
      (team) =>
        team.team_number ===
        referencePlayer.initial_team_number,
    );

  const opponentTeam =
    match.team_scores.find(
      (team) =>
        team.team_number !==
        referencePlayer.initial_team_number,
    );

  const playerScore =
    playerTeam?.score ?? 0;

  const opponentScore =
    opponentTeam?.score ?? 0;

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

function MatchCard({
  match,
}: {
  match: Match;
}) {
  const {
    result,
    playerScore,
    opponentScore,
  } = getMatchResult(match);

  const rosterPlayers =
    getRosterPlayers(match);

  return (
    <article className="team-match">
      <div className="team-match__top">
        <div className="team-match__badges">
          <span
            className={`team-match__result team-match__result--${result.toLowerCase()}`}
          >
            {result}
          </span>

          <span className="team-match__mode">
            {formatGameMode(
              match.data_source,
            )}
          </span>

          <span className="team-match__players-count">
            {rosterPlayers.length} KA HVISS?
          </span>
        </div>

        <span className="team-match__date">
          {formatDate(
            match.finished_at,
          )}
        </span>
      </div>

      <div className="team-match__main">
        <div>
          <span className="team-match__label">
            MAP
          </span>

          <h3>
            {formatMapName(
              match.map_name,
            )}
          </h3>
        </div>

        <div className="team-match__score">
          {playerScore}

          <small>:</small>

          {opponentScore}
        </div>
      </div>

      <div className="team-match__roster">
        {rosterPlayers.map(
          (player) => (
            <div
              className="team-match__player"
              key={
                player.steam64_id
              }
            >
              <div className="team-match__player-name">
                <strong>
                  {player.name}
                </strong>

                <span>
                  {player.kd_ratio.toFixed(
                    2,
                  )}{" "}
                  KD
                </span>
              </div>

              <div className="team-match__player-stats">
                <span>
                  {player.total_kills}K
                </span>

                <span>
                  {player.total_deaths}D
                </span>

                <span>
                  {player.total_assists}A
                </span>

                <strong
                  className={
                    player.leetify_rating >= 0
                      ? "rating-positive"
                      : "rating-negative"
                  }
                >
                  {formatRating(
                    player.leetify_rating,
                  )}
                </strong>
              </div>
            </div>
          ),
        )}
      </div>
    </article>
  );
}

function Matches() {
  const [matches, setMatches] =
    useState<Match[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(false);

  useEffect(() => {
    async function loadMatches() {
      try {
        const response =
          await fetch("/api/matches");

        if (!response.ok) {
          throw new Error(
            "Could not load matches",
          );
        }

        const data =
          await response.json();

        setMatches(data);
      } catch (error) {
        console.error(error);

        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadMatches();
  }, []);

  return (
    <section
      className="matches"
      id="matches"
    >
      <div className="matches__header">
        <div>
          <span className="matches__eyebrow">
            KA HVISS? / CS2
          </span>

          <h2>RECENT GAMES.</h2>
        </div>

        <div className="matches__header-meta">
          <span>
            TEAM MATCHES ONLY
          </span>

          <p>
            At least two roster members.
          </p>
        </div>
      </div>

      {loading && (
        <div className="matches__state">
          <span>LOADING MATCH FEED</span>

          <p>
            Searching for teamwork...
          </p>
        </div>
      )}

      {error && (
        <div className="matches__state">
          <span>OFFLINE</span>

          <p>
            Match history is currently unavailable.
          </p>
        </div>
      )}

      {!loading &&
        !error &&
        matches.length > 0 && (
          <div className="matches__grid">
            {matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
              />
            ))}
          </div>
        )}

      {!loading &&
        !error &&
        matches.length === 0 && (
          <div className="matches__state">
            <span>
              NO TEAM MATCHES FOUND
            </span>

            <p>
              Seven players. Somehow nobody queued together.
            </p>
          </div>
        )}

      <div className="matches__credit">
        DATA PROVIDED BY LEETIFY
      </div>
    </section>
  );
}

export default Matches;