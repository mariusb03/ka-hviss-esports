import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { players as roster } from "../data/players";

import "./RatingHistory.css";

type RatingPoint = {
  id: string;
  date: string;
  rating: number;
  outcome: string;
  mapName: string;
};

type RatingPlayer = {
  name: string;
  steamId: string;
  currentRating: number | null;
  history: RatingPoint[];
};

type ApiResponse = {
  players: RatingPlayer[];
};

type Period = "7D" | "30D" | "ALL";

const LINE_COLORS = [
  "#35a7ff",
  "#43ff9a",
  "#ff5263",
  "#f4c542",
  "#b77cff",
  "#ff8b3d",
  "#65e6ff",
];

function getCutoff(period: Period) {
  const now = Date.now();

  if (period === "7D") {
    return (
      now -
      7 * 24 * 60 * 60 * 1000
    );
  }

  if (period === "30D") {
    return (
      now -
      30 * 24 * 60 * 60 * 1000
    );
  }

  return null;
}

function formatRating(
  rating: number,
) {
  return rating.toLocaleString(
    "en-US",
  );
}

function formatAxisRating(
  rating: number,
) {
  return `${Math.round(
    rating / 1000,
  )}K`;
}

function formatDate(
  timestamp: number,
) {
  return new Intl.DateTimeFormat(
    "en",
    {
      day: "2-digit",
      month: "short",
    },
  )
    .format(new Date(timestamp))
    .toUpperCase();
}

function RatingHistory() {
  const [data, setData] =
    useState<RatingPlayer[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(false);

  const [period, setPeriod] =
    useState<Period>("30D");

  const [
    selectedPlayer,
    setSelectedPlayer,
  ] = useState("ALL");

  useEffect(() => {
    async function loadRatings() {
      try {
        const response =
          await fetch(
            "/api/ratings",
          );

        if (!response.ok) {
          throw new Error(
            "Could not load rating history",
          );
        }

        const result =
          (await response.json()) as ApiResponse;

        setData(result.players);
      } catch (error) {
        console.error(error);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadRatings();
  }, []);

  const visiblePlayers =
    useMemo(() => {
      const cutoff =
        getCutoff(period);

      return data
        .filter(
          (player) =>
            selectedPlayer ===
              "ALL" ||
            player.steamId ===
              selectedPlayer,
        )
        .map((player) => ({
          ...player,

          history:
            cutoff === null
              ? player.history
              : player.history.filter(
                  (point) =>
                    new Date(
                      point.date,
                    ).getTime() >=
                    cutoff,
                ),
        }))
        .filter(
          (player) =>
            player.history.length >
            0,
        );
    }, [
      data,
      period,
      selectedPlayer,
    ]);

  const graph = useMemo(() => {
    const allPoints =
      visiblePlayers.flatMap(
        (player) =>
          player.history.map(
            (point) => ({
              ...point,
              timestamp:
                new Date(
                  point.date,
                ).getTime(),
            }),
          ),
      );

    if (allPoints.length === 0) {
      return null;
    }

    const minTime = Math.min(
      ...allPoints.map(
        (point) =>
          point.timestamp,
      ),
    );

    const maxTime = Math.max(
      ...allPoints.map(
        (point) =>
          point.timestamp,
      ),
    );

    const ratings =
      allPoints.map(
        (point) =>
          point.rating,
      );

    const rawMin =
      Math.min(...ratings);

    const rawMax =
      Math.max(...ratings);

    const padding = Math.max(
      (rawMax - rawMin) * 0.15,
      500,
    );

    const minRating =
      Math.floor(
        (rawMin - padding) /
          500,
      ) * 500;

    const maxRating =
      Math.ceil(
        (rawMax + padding) /
          500,
      ) * 500;

    return {
      minTime,
      maxTime,
      minRating,
      maxRating,
    };
  }, [visiblePlayers]);

  const width = 1000;
  const height = 440;

  const paddingLeft = 72;
  const paddingRight = 28;
  const paddingTop = 30;
  const paddingBottom = 52;

  function getX(
    timestamp: number,
  ) {
    if (!graph) {
      return paddingLeft;
    }

    if (
      graph.maxTime ===
      graph.minTime
    ) {
      return width / 2;
    }

    const ratio =
      (timestamp -
        graph.minTime) /
      (graph.maxTime -
        graph.minTime);

    return (
      paddingLeft +
      ratio *
        (width -
          paddingLeft -
          paddingRight)
    );
  }

  function getY(
    rating: number,
  ) {
    if (!graph) {
      return height / 2;
    }

    const range =
      graph.maxRating -
        graph.minRating ||
      1;

    const ratio =
      (rating -
        graph.minRating) /
      range;

    return (
      paddingTop +
      (1 - ratio) *
        (height -
          paddingTop -
          paddingBottom)
    );
  }

  const yTicks =
    useMemo(() => {
      if (!graph) {
        return [];
      }

      return Array.from(
        { length: 5 },
        (_, index) => {
          const ratio =
            index / 4;

          return (
            graph.maxRating -
            ratio *
              (graph.maxRating -
                graph.minRating)
          );
        },
      );
    }, [graph]);

  const xTicks =
    useMemo(() => {
      if (!graph) {
        return [];
      }

      return Array.from(
        { length: 4 },
        (_, index) => {
          const ratio =
            index / 3;

          return (
            graph.minTime +
            ratio *
              (graph.maxTime -
                graph.minTime)
          );
        },
      );
    }, [graph]);

  return (
    <div className="rating-history">
      <div className="rating-history__header">
        <div>
          <span>
            PREMIER /
            PERFORMANCE TRACKING
          </span>

          <h3>
            CS RATING HISTORY.
          </h3>
        </div>

        <p>
          Post-match Premier
          rating from Leetify.
        </p>
      </div>

      <div className="rating-history__controls">
        <div className="rating-history__filters">
          <button
            type="button"
            className={
              selectedPlayer ===
              "ALL"
                ? "active"
                : ""
            }
            onClick={() =>
              setSelectedPlayer(
                "ALL",
              )
            }
          >
            ALL PLAYERS
          </button>

          {roster.map(
            (player) => (
              <button
                type="button"
                key={
                  player.steamId
                }
                className={
                  selectedPlayer ===
                  player.steamId
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setSelectedPlayer(
                    player.steamId,
                  )
                }
              >
                {player.name}
              </button>
            ),
          )}
        </div>

        <div className="rating-history__periods">
          {(
            [
              "7D",
              "30D",
              "ALL",
            ] as Period[]
          ).map((option) => (
            <button
              type="button"
              key={option}
              className={
                period === option
                  ? "active"
                  : ""
              }
              onClick={() =>
                setPeriod(option)
              }
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="rating-history__state">
          LOADING RATING
          HISTORY...
        </div>
      )}

      {error && (
        <div className="rating-history__state">
          RATING HISTORY
          UNAVAILABLE.
        </div>
      )}

      {!loading &&
        !error &&
        graph && (
          <>
            <div className="rating-history__chart">
              <svg
                viewBox={`0 0 ${width} ${height}`}
                role="img"
                aria-label="CS Rating history"
              >
                {yTicks.map(
                  (tick) => {
                    const y =
                      getY(tick);

                    return (
                      <g
                        key={
                          tick
                        }
                      >
                        <line
                          x1={
                            paddingLeft
                          }
                          x2={
                            width -
                            paddingRight
                          }
                          y1={y}
                          y2={y}
                          className="rating-history__grid-line"
                        />

                        <text
                          x={
                            paddingLeft -
                            16
                          }
                          y={
                            y + 4
                          }
                          textAnchor="end"
                          className="rating-history__axis-label"
                        >
                          {formatAxisRating(
                            tick,
                          )}
                        </text>
                      </g>
                    );
                  },
                )}

                {xTicks.map(
                  (tick) => (
                    <text
                      key={
                        tick
                      }
                      x={getX(
                        tick,
                      )}
                      y={
                        height -
                        16
                      }
                      textAnchor="middle"
                      className="rating-history__axis-label"
                    >
                      {formatDate(
                        tick,
                      )}
                    </text>
                  ),
                )}

                {visiblePlayers.map(
                  (
                    player,
                    playerIndex,
                  ) => {
                    const points =
                      player.history.map(
                        (
                          point,
                        ) => ({
                          ...point,

                          x: getX(
                            new Date(
                              point.date,
                            ).getTime(),
                          ),

                          y: getY(
                            point.rating,
                          ),
                        }),
                      );

                    const path =
                      points
                        .map(
                          (
                            point,
                            index,
                          ) =>
                            `${
                              index ===
                              0
                                ? "M"
                                : "L"
                            } ${point.x} ${point.y}`,
                        )
                        .join(" ");

                    const color =
                      LINE_COLORS[
                        playerIndex %
                          LINE_COLORS.length
                      ];

                    return (
                      <g
                        key={
                          player.steamId
                        }
                      >
                        <path
                          d={path}
                          fill="none"
                          stroke={
                            color
                          }
                          strokeWidth="3"
                          strokeLinejoin="round"
                          strokeLinecap="round"
                        />

                        {points.map(
                          (
                            point,
                          ) => (
                            <circle
                              key={
                                point.id
                              }
                              cx={
                                point.x
                              }
                              cy={
                                point.y
                              }
                              r="4.5"
                              fill="#050912"
                              stroke={
                                color
                              }
                              strokeWidth="3"
                            >
                              <title>
                                {
                                  player.name
                                }{" "}
                                ·{" "}
                                {
                                  point.rating
                                }{" "}
                                ·{" "}
                                {formatMapName(
                                  point.mapName,
                                )}
                              </title>
                            </circle>
                          ),
                        )}
                      </g>
                    );
                  },
                )}
              </svg>
            </div>

            <div className="rating-history__legend">
              {visiblePlayers.map(
                (
                  player,
                  index,
                ) => (
                  <div
                    key={
                      player.steamId
                    }
                  >
                    <span
                      className="rating-history__legend-dot"
                      style={{
                        background:
                          LINE_COLORS[
                            index %
                              LINE_COLORS.length
                          ],
                      }}
                    />

                    <span>
                      {
                        player.name
                      }
                    </span>

                    <strong>
                      {player.currentRating !==
                      null
                        ? formatRating(
                            player.currentRating,
                          )
                        : "—"}
                    </strong>
                  </div>
                ),
              )}
            </div>
          </>
        )}

      {!loading &&
        !error &&
        !graph && (
          <div className="rating-history__state">
            NO PREMIER RATING DATA
            FOR THIS PERIOD.
          </div>
        )}

      <div className="rating-history__credit">
        DATA PROVIDED BY LEETIFY
      </div>
    </div>
  );
}

function formatMapName(
  mapName: string,
) {
  return mapName
    .replace("de_", "")
    .replace("cs_", "")
    .toUpperCase();
}

export default RatingHistory;