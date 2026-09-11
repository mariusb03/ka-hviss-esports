import { useEffect, useState } from "react";
import "./Matches.css";

const PLAYERS = [
  {
    name: "Brotato",
    steamId: "76561198285667407",
    number: "01",
  },
  {
    name: "Selnes",
    steamId: "76561198815099525",
    number: "02",
  },
  {
    name: "Toonga",
    steamId: "76561198170149487",
    number: "03",
  },
  {
    name: "Ewan M+cgregor",
    steamId: "76561198176454129",
    number: "04",
  },
];

const PLAYER_IDS = PLAYERS.map((player) => player.steamId);

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

type MatchColumnProps = {
  eyebrow: string;
  title: string;
  matches: Match[];
};

function formatMapName(mapName: string) {
  return mapName.replace("de_", "").replace("cs_", "").toUpperCase();
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
      return dataSource.replaceAll("_", " ").toUpperCase();
  }
}

function getRosterPlayers(match: Match) {
  return match.stats.filter((player) => PLAYER_IDS.includes(player.steam64_id));
}

function getMatchResult(match: Match) {
  const player = match.stats[0];

  if (!player) {
    return {
      result: "DRAW",
      playerScore: 0,
      opponentScore: 0,
    };
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

  return {
    result,
    playerScore,
    opponentScore,
  };
}

function formatLeetifyRating(rating: number) {
  const value = rating * 100;

  return `${value > 0 ? "+" : ""}${value.toFixed(1)}`;
}

function MatchCard({ match }: { match: Match }) {
  const { result, playerScore, opponentScore } = getMatchResult(match);

  const rosterPlayers = getRosterPlayers(match);

  return (
    <article className={`compact-match compact-match--${result.toLowerCase()}`}>
      <div className="compact-match__top">
        <div className="compact-match__badges">
          <span
            className={`compact-match__result compact-match__result--${result.toLowerCase()}`}
          >
            {result}
          </span>

          <span className="compact-match__mode">
            {formatGameMode(match.data_source)}
          </span>
        </div>

        <span className="compact-match__date">
          {formatDate(match.finished_at)}
        </span>
      </div>

      <div className="compact-match__main">
        <div>
          <span className="compact-match__label">MAP</span>

          <h4>{formatMapName(match.map_name)}</h4>
        </div>

        <div className="compact-match__score">
          <strong>{playerScore}</strong>

          <span>:</span>

          <strong>{opponentScore}</strong>
        </div>
      </div>

      <div className="compact-match__players">
        {rosterPlayers.map((player) => (
          <div className="compact-player" key={player.steam64_id}>
            <div className="compact-player__header">
              <strong>{player.name}</strong>

              <span>{player.kd_ratio.toFixed(2)} KD</span>
            </div>

            <div className="compact-player__stats">
              <div>
                <span>K</span>
                <strong>{player.total_kills}</strong>
              </div>

              <div>
                <span>D</span>
                <strong>{player.total_deaths}</strong>
              </div>

              <div>
                <span>A</span>
                <strong>{player.total_assists}</strong>
              </div>

              <div>
                <span>HS</span>
                <strong>{player.total_hs_kills}</strong>
              </div>

              <div>
                <span>RATING</span>

                <strong
                  className={
                    player.leetify_rating >= 0
                      ? "rating rating--positive"
                      : "rating rating--negative"
                  }
                >
                  {formatLeetifyRating(player.leetify_rating)}
                </strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function MatchColumn({ eyebrow, title, matches }: MatchColumnProps) {
  return (
    <div className="match-column">
      <div className="match-column__header">
        <div>
          <span className="match-column__eyebrow">{eyebrow}</span>

          <h3>{title}</h3>
        </div>

        <span className="match-column__count">
          {String(matches.length).padStart(2, "0")} MATCHES
        </span>
      </div>

      <div className="match-column__list">
        {matches.length > 0 ? (
          matches.map((match) => <MatchCard match={match} key={match.id} />)
        ) : (
          <div className="match-column__empty">
            <span>NO MATCHES FOUND</span>

            <p>Absolutely nothing happened here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TogetherMatches({ matches }: { matches: Match[] }) {
  return (
    <div className="together-feed">
      <div className="together-feed__header">
        <div>
          <span>KA HVISS? / CS2</span>

          <h3>TOGETHER.</h3>
        </div>

        <div className="together-feed__meta">
          <span>{String(matches.length).padStart(2, "0")} MATCHES</span>

          <strong>THE ACTUAL TEAM GAMES</strong>
        </div>
      </div>

      {matches.length > 0 ? (
        <div className="together-feed__grid">
          {matches.map((match) => (
            <MatchCard match={match} key={match.id} />
          ))}
        </div>
      ) : (
        <div className="match-column__empty">
          <span>NO TEAM GAMES FOUND</span>

          <p>Perhaps queue together for once.</p>
        </div>
      )}
    </div>
  );
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

  /*
   * A "together" match is any game containing
   * at least two current Ka Hviss? players.
   */
  const togetherMatches = matches
    .filter((match) => getRosterPlayers(match).length >= 2)
    .slice(0, 6);

  /*
   * Solo column:
   * player participated, but no other
   * current roster member did.
   */
  function getSoloMatches(steamId: string) {
    return matches
      .filter((match) => {
        const rosterPlayers = getRosterPlayers(match);

        return (
          rosterPlayers.length === 1 && rosterPlayers[0].steam64_id === steamId
        );
      })
      .slice(0, 5);
  }

  return (
    <section className="matches" id="matches">
      <div className="matches__header">
        <div>
          <span className="matches__eyebrow">CS2 / MATCH FEED</span>

          <h2>RECENT GAMES.</h2>
        </div>

        <span className="matches__status">QUESTIONABLE FORM / LIVE DATA</span>
      </div>

      {loading && (
        <div className="matches__message">
          <span>LOADING</span>

          <p>Investigating recent questionable decisions...</p>
        </div>
      )}

      {error && (
        <div className="matches__message">
          <span>OFFLINE</span>

          <p>Match history is currently unavailable.</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <TogetherMatches matches={togetherMatches} />

          <div className="solo-feed__header">
            <span>INDIVIDUAL FORM</span>

            <p>Recent matches played without another Ka Hviss? player.</p>
          </div>

          <div className="match-columns">
            {PLAYERS.map((player) => (
              <MatchColumn
                key={player.steamId}
                eyebrow={`SOLO MATCHES / ${player.number}`}
                title={player.name}
                matches={getSoloMatches(player.steamId)}
              />
            ))}
          </div>
        </>
      )}

      <div className="matches__credit">DATA PROVIDED BY LEETIFY</div>
    </section>
  );
}

export default Matches;
