import { useEffect, useState } from "react";
import "./Matches.css";

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
  return mapName.replace("de_", "").replace("cs_", "").toUpperCase();
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("no-NO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function Matches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadMatches() {
      try {
        const response = await fetch("/api/matches");

        if (!response.ok) {
          throw new Error("Could not load matches");
        }

        const data = await response.json();

        setMatches(data.slice(0, 5));
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
    <section className="matches" id="matches">
      <div className="matches__header">
        <div>
          <span className="matches__eyebrow">CS2 / MATCH HISTORY</span>
          <h2>RECENT GAMES.</h2>
        </div>

        <span className="matches__status">POWERED BY QUESTIONABLE AIM</span>
      </div>

      {loading && <p className="matches__message">Loading match history...</p>}

      {error && (
        <p className="matches__message">
          Match history is currently unavailable.
        </p>
      )}

      {!loading && !error && (
        <div className="matches__list">
          {matches.map((match) => {
            const player = match.stats[0];

            if (!player) {
              return null;
            }

            const playerTeam = match.team_scores.find(
              (team) => team.team_number === player.initial_team_number,
            );

            const opponentTeam = match.team_scores.find(
              (team) => team.team_number !== player.initial_team_number,
            );

            const playerScore = playerTeam?.score ?? 0;
            const opponentScore = opponentTeam?.score ?? 0;

            const result =
              playerScore > opponentScore
                ? "WIN"
                : playerScore < opponentScore
                  ? "LOSS"
                  : "DRAW";

            return (
              <article
                className={`match-card match-card--${result.toLowerCase()}`}
                key={match.id}
              >
                <div className="match-card__meta">
                  <span
                    className={`match-card__result match-card__result--${result.toLowerCase()}`}
                  >
                    {result}
                  </span>

                  <span>{formatDate(match.finished_at)}</span>
                </div>

                <div className="match-card__main">
                  <div>
                    <span className="match-card__label">MAP</span>
                    <h3>{formatMapName(match.map_name)}</h3>
                  </div>

                  <div className="match-card__score">
                    <span>{playerScore}</span>
                    <small>:</small>
                    <span>{opponentScore}</span>
                  </div>
                </div>

                <div className="match-card__players">
                  {match.stats.map((player) => (
                    <div className="match-player" key={player.steam64_id}>
                      <div className="match-player__name">
                        <span>PLAYER</span>
                        <strong>{player.name}</strong>
                      </div>

                      <div>
                        <span>K / D / A</span>
                        <strong>
                          {player.total_kills} / {player.total_deaths} /{" "}
                          {player.total_assists}
                        </strong>
                      </div>

                      <div>
                        <span>K/D</span>
                        <strong>{player.kd_ratio.toFixed(2)}</strong>
                      </div>

                      <div>
                        <span>HS</span>
                        <strong>{player.total_hs_kills}</strong>
                      </div>

                      <div>
                        <span>LEETIFY</span>
                        <strong>
                          {player.leetify_rating > 0 ? "+" : ""}
                          {player.leetify_rating.toFixed(3)}
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="matches__credit">Data Provided by Leetify</div>
    </section>
  );
}

export default Matches;
