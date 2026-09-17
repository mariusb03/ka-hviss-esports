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
};

type Match = {
  id: string;
  finished_at: string;
  data_source: string;
  map_name: string;

  team_scores: TeamScore[];
  stats: PlayerStats[];
};

type ProfileRecentMatch = {
  id: string;
  finished_at: string;

  data_source: string;
  outcome: "win" | "loss" | "tie";

  rank: number;
  rank_type: number;

  map_name: string;

  leetify_rating: number;

  score: [number, number];
};

type Profile = {
  name: string;
  steam64_id: string;

  ranks: {
    leetify: number | null;
    premier: number | null;
    faceit: number | null;
    faceit_elo: number | null;
  };

  rating: {
    aim: number;
    positioning: number;
    utility: number;
    clutch: number;
    opening: number;
  };

  stats: {
    accuracy_head: number;
    reaction_time_ms: number;
    spray_accuracy: number;
  };

  recent_matches: ProfileRecentMatch[];
};

type PlayerApiResponse = {
  profile: Profile;
  matches: Match[];
};

type PlayerProfileProps = {
  player: Player;
};

type RatingChange = {
  value: number | null;
  available: boolean;
};

function formatMapName(
  mapName: string,
) {
  return mapName
    .replace("de_", "")
    .replace("cs_", "")
    .toUpperCase();
}

function formatGameMode(
  dataSource: string,
) {
  switch (dataSource) {
    case "matchmaking":
      return "PREMIER";

    case "matchmaking_competitive":
      return "COMPETITIVE";

    case "matchmaking_wingman":
      return "WINGMAN";

    default:
      return dataSource
        .replaceAll("_", " ")
        .toUpperCase();
  }
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat(
    "no-NO",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(new Date(date));
}

function formatRating(
  rating: number,
) {
  const value = rating * 100;

  return `${
    value > 0 ? "+" : ""
  }${value.toFixed(1)}`;
}

function formatCsRating(
  rating: number | null | undefined,
) {
  if (
    rating === null ||
    rating === undefined
  ) {
    return "—";
  }

  return rating.toLocaleString("en-US");
}

function formatChange(
  value: number | null,
) {
  if (value === null) {
    return "—";
  }

  if (value > 0) {
    return `+${value.toLocaleString(
      "en-US",
    )}`;
  }

  return value.toLocaleString("en-US");
}

function getPlayerStats(
  match: Match,
  steamId: string,
) {
  return match.stats.find(
    (stats) =>
      stats.steam64_id === steamId,
  );
}

function getMatchResult(
  match: Match,
  steamId: string,
) {
  const stats = getPlayerStats(
    match,
    steamId,
  );

  if (!stats) {
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
        stats.initial_team_number,
    );

  const opponentTeam =
    match.team_scores.find(
      (team) =>
        team.team_number !==
        stats.initial_team_number,
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

function getRatingChange(
  history: ProfileRecentMatch[],
  currentRating: number | null,
  days: number,
): RatingChange {
  if (
    currentRating === null ||
    history.length === 0
  ) {
    return {
      value: null,
      available: false,
    };
  }

  const premierHistory = history
    .filter(
      (match) =>
        match.rank_type === 11 &&
        match.rank > 0,
    )
    .sort(
      (a, b) =>
        new Date(a.finished_at).getTime() -
        new Date(b.finished_at).getTime(),
    );

  if (premierHistory.length === 0) {
    return {
      value: null,
      available: false,
    };
  }

  const cutoff =
    Date.now() -
    days * 24 * 60 * 60 * 1000;

  /*
   * Best baseline:
   * the latest known rating at or before
   * the start of the requested period.
   */
  const beforeCutoff = premierHistory.filter(
    (match) =>
      new Date(
        match.finished_at,
      ).getTime() <= cutoff,
  );

  const baseline =
    beforeCutoff[
      beforeCutoff.length - 1
    ];

  if (!baseline) {
    return {
      value: null,
      available: false,
    };
  }

  return {
    value:
      currentRating - baseline.rank,
    available: true,
  };
}

function PlayerProfile({
  player,
}: PlayerProfileProps) {
  const [data, setData] =
    useState<PlayerApiResponse | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(false);

  useEffect(() => {
    const controller =
      new AbortController();

    async function loadPlayer() {
      setLoading(true);
      setError(false);

      try {
        const response =
          await fetch(
            `/api/player?steamId=${player.steamId}`,
            {
              signal:
                controller.signal,
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
        if (
          !controller.signal.aborted
        ) {
          setLoading(false);
        }
      }
    }

    loadPlayer();

    return () =>
      controller.abort();
  }, [player.steamId]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const detailedMatches =
    data?.matches.slice(0, 10) ?? [];

  const premierHistory = useMemo(
    () =>
      (
        data?.profile
          .recent_matches ?? []
      )
        .filter(
          (match) =>
            match.rank_type ===
              11 &&
            match.rank > 0,
        )
        .sort(
          (a, b) =>
            new Date(
              b.finished_at,
            ).getTime() -
            new Date(
              a.finished_at,
            ).getTime(),
        ),
    [data],
  );

  const ratingChangeByMatch =
    useMemo(() => {
      const changes =
        new Map<
          string,
          {
            before: number | null;
            after: number;
            change: number | null;
          }
        >();

      premierHistory.forEach(
        (match, index) => {
          const olderMatch =
            premierHistory[index + 1];

          changes.set(match.id, {
            after: match.rank,

            before:
              olderMatch?.rank ??
              null,

            change: olderMatch
              ? match.rank -
                olderMatch.rank
              : null,
          });
        },
      );

      return changes;
    }, [premierHistory]);

  const currentRating =
    data?.profile.ranks
      ?.premier ?? null;

  const change24h = useMemo(
    () =>
      getRatingChange(
        data?.profile
          .recent_matches ?? [],
        currentRating,
        1,
      ),
    [data, currentRating],
  );

  const change7d = useMemo(
    () =>
      getRatingChange(
        data?.profile
          .recent_matches ?? [],
        currentRating,
        7,
      ),
    [data, currentRating],
  );

  const change30d = useMemo(
    () =>
      getRatingChange(
        data?.profile
          .recent_matches ?? [],
        currentRating,
        30,
      ),
    [data, currentRating],
  );

  const peakRating = useMemo(() => {
    const ratings =
      premierHistory.map(
        (match) => match.rank,
      );

    if (
      currentRating !== null
    ) {
      ratings.push(currentRating);
    }

    if (ratings.length === 0) {
      return null;
    }

    return Math.max(...ratings);
  }, [
    premierHistory,
    currentRating,
  ]);

  const summary = useMemo(() => {
    if (
      detailedMatches.length === 0
    ) {
      return {
        kd: 0,
        hsPercentage: 0,
        leetifyRating: 0,
        damagePerRound: 0,
      };
    }

    let kills = 0;
    let deaths = 0;
    let headshots = 0;

    let ratingTotal = 0;
    let ratingCount = 0;

    let damageTotal = 0;
    let damageCount = 0;

    for (
      const match of
      detailedMatches
    ) {
      const stats =
        getPlayerStats(
          match,
          player.steamId,
        );

      if (!stats) {
        continue;
      }

      kills +=
        stats.total_kills;

      deaths +=
        stats.total_deaths;

      headshots +=
        stats.total_hs_kills;

      ratingTotal +=
        stats.leetify_rating;

      ratingCount += 1;

      if (
        typeof stats.dpr ===
        "number"
      ) {
        damageTotal +=
          stats.dpr;

        damageCount += 1;
      }
    }

    return {
      kd:
        deaths > 0
          ? kills / deaths
          : kills,

      hsPercentage:
        kills > 0
          ? (headshots /
              kills) *
            100
          : 0,

      leetifyRating:
        ratingCount > 0
          ? ratingTotal /
            ratingCount
          : 0,

      damagePerRound:
        damageCount > 0
          ? damageTotal /
            damageCount
          : 0,
    };
  }, [
    detailedMatches,
    player.steamId,
  ]);

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
              PLAYER /{" "}
              {player.number}
            </span>

            <h3>
              {player.name}
            </h3>

            <p>
              KA HVISS? /
              COUNTER-STRIKE 2
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
          <span>
            LOADING PLAYER DATA
          </span>

          <p>
            Consulting the
            statistics department...
          </p>
        </div>
      )}

      {error && (
        <div className="player-profile__state">
          <span>
            PROFILE UNAVAILABLE
          </span>

          <p>
            Leetify returned
            absolutely nothing useful.
          </p>
        </div>
      )}

      {!loading &&
        !error &&
        data && (
          <>
            <div className="cs-rating">
              <div className="cs-rating__main">
                <span>
                  CURRENT CS RATING
                </span>

                <strong>
                  {formatCsRating(
                    currentRating,
                  )}
                </strong>

                <p>
                  PREMIER
                </p>
              </div>

              <div className="cs-rating__changes">
                <RatingChangeCard
                  label="24 HOURS"
                  change={
                    change24h
                  }
                />

                <RatingChangeCard
                  label="7 DAYS"
                  change={
                    change7d
                  }
                />

                <RatingChangeCard
                  label="30 DAYS"
                  change={
                    change30d
                  }
                />

                <div className="cs-rating__change">
                  <span>
                    RECENT PEAK
                  </span>

                  <strong>
                    {formatCsRating(
                      peakRating,
                    )}
                  </strong>
                </div>
              </div>
            </div>

            <div className="player-profile__section-header">
              <span>
                LEETIFY /
                RECENT FORM
              </span>

              <p>
                Based on the latest{" "}
                {
                  detailedMatches.length
                }{" "}
                matches.
              </p>
            </div>

            <div className="player-profile__stats">
              <div>
                <span>K/D</span>

                <strong>
                  {summary.kd.toFixed(
                    2,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  HEADSHOTS
                </span>

                <strong>
                  {summary.hsPercentage.toFixed(
                    0,
                  )}
                  %
                </strong>
              </div>

              <div>
                <span>
                  LEETIFY
                </span>

                <strong
                  className={
                    summary.leetifyRating >=
                    0
                      ? "player-profile__positive"
                      : "player-profile__negative"
                  }
                >
                  {formatRating(
                    summary.leetifyRating,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  DMG / ROUND
                </span>

                <strong>
                  {summary.damagePerRound >
                  0
                    ? summary.damagePerRound.toFixed(
                        1,
                      )
                    : "—"}
                </strong>
              </div>

              <div>
                <span>AIM</span>

                <strong>
                  {data.profile.rating.aim.toFixed(
                    1,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  POSITIONING
                </span>

                <strong>
                  {data.profile.rating.positioning.toFixed(
                    1,
                  )}
                </strong>
              </div>
            </div>

            <div className="player-profile__section-header player-profile__section-header--matches">
              <span>
                RECENT MATCHES
              </span>

              <p>LAST 10</p>
            </div>

            <div className="player-profile__matches">
              {detailedMatches.map(
                (match) => {
                  const stats =
                    getPlayerStats(
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
                  } =
                    getMatchResult(
                      match,
                      player.steamId,
                    );

                  const ratingData =
                    ratingChangeByMatch.get(
                      match.id,
                    );

                  return (
                    <article
                      className="profile-match"
                      key={
                        match.id
                      }
                    >
                      <div className="profile-match__top">
                        <div className="profile-match__badges">
                          <span
                            className={`profile-match__result profile-match__result--${result.toLowerCase()}`}
                          >
                            {
                              result
                            }
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
                          <span>
                            MAP
                          </span>

                          <h4>
                            {formatMapName(
                              match.map_name,
                            )}
                          </h4>
                        </div>

                        <div className="profile-match__score">
                          {
                            playerScore
                          }

                          <small>
                            :
                          </small>

                          {
                            opponentScore
                          }
                        </div>
                      </div>

                      <div className="profile-match__numbers">
                        <div>
                          <span>
                            K
                          </span>

                          <strong>
                            {
                              stats.total_kills
                            }
                          </strong>
                        </div>

                        <div>
                          <span>
                            D
                          </span>

                          <strong>
                            {
                              stats.total_deaths
                            }
                          </strong>
                        </div>

                        <div>
                          <span>
                            A
                          </span>

                          <strong>
                            {
                              stats.total_assists
                            }
                          </strong>
                        </div>

                        <div>
                          <span>
                            K/D
                          </span>

                          <strong>
                            {stats.kd_ratio.toFixed(
                              2,
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            LEETIFY
                          </span>

                          <strong
                            className={
                              stats.leetify_rating >=
                              0
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

                      {match.data_source ===
                        "matchmaking" &&
                        ratingData && (
                          <div className="profile-match__rating">
                            <div>
                              <span>
                                CS
                                RATING
                              </span>

                              <strong>
                                {ratingData.before !==
                                null
                                  ? `${formatCsRating(
                                      ratingData.before,
                                    )} → `
                                  : ""}

                                {formatCsRating(
                                  ratingData.after,
                                )}
                              </strong>
                            </div>

                            <span
                              className={`profile-match__rating-change ${
                                ratingData.change ===
                                null
                                  ? ""
                                  : ratingData.change >=
                                      0
                                    ? "profile-match__rating-change--positive"
                                    : "profile-match__rating-change--negative"
                              }`}
                            >
                              {formatChange(
                                ratingData.change,
                              )}
                            </span>
                          </div>
                        )}
                    </article>
                  );
                },
              )}
            </div>

            <div className="player-profile__credit">
              DATA PROVIDED BY
              LEETIFY
            </div>
          </>
        )}
    </div>
  );
}

function RatingChangeCard({
  label,
  change,
}: {
  label: string;
  change: RatingChange;
}) {
  return (
    <div className="cs-rating__change">
      <span>{label}</span>

      <strong
        className={
          change.value === null
            ? ""
            : change.value >= 0
              ? "player-profile__positive"
              : "player-profile__negative"
        }
      >
        {change.available
          ? formatChange(
              change.value,
            )
          : "—"}
      </strong>
    </div>
  );
}

export default PlayerProfile;