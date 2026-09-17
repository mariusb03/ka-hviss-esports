import {
  useEffect,
  useMemo,
  useState,
  type PointerEvent as ReactPointerEvent,
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

type TooltipPoint = {
  playerName: string;
  steamId: string;
  color: string;

  point: RatingPoint;

  x: number;
  y: number;

  change: number | null;
};

type ChartPoint = RatingPoint & {
  x: number;
  y: number;
  change: number | null;
};

type ChartSeries = {
  player: RatingPlayer;
  color: string;
  points: ChartPoint[];
  path: string;
};

const LINE_COLORS = [
  "#35a7ff",
  "#43ff9a",
  "#ff5263",
  "#f4c542",
  "#b77cff",
  "#ff8b3d",
  "#65e6ff",
];

const HOVER_DISTANCE = 26;

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

function formatTooltipDate(
  date: string,
) {
  return new Intl.DateTimeFormat(
    "en",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  )
    .format(new Date(date))
    .toUpperCase();
}

function formatRatingChange(
  change: number | null,
) {
  if (change === null) {
    return "—";
  }

  if (change > 0) {
    return `+${change.toLocaleString(
      "en-US",
    )}`;
  }

  return change.toLocaleString(
    "en-US",
  );
}

function getOutcomeLabel(
  outcome: string,
) {
  const value =
    outcome.toLowerCase();

  if (
    value === "win" ||
    value === "won"
  ) {
    return "WIN";
  }

  if (
    value === "loss" ||
    value === "lost"
  ) {
    return "LOSS";
  }

  if (
    value === "draw" ||
    value === "tie"
  ) {
    return "DRAW";
  }

  return outcome.toUpperCase();
}

function getPlayerColor(
  steamId: string,
) {
  const rosterIndex =
    roster.findIndex(
      (player) =>
        player.steamId === steamId,
    );

  if (rosterIndex < 0) {
    return LINE_COLORS[0];
  }

  return LINE_COLORS[
    rosterIndex %
      LINE_COLORS.length
  ];
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

  const [
    hoveredPoint,
    setHoveredPoint,
  ] =
    useState<TooltipPoint | null>(
      null,
    );

  const [
    pinnedPoint,
    setPinnedPoint,
  ] =
    useState<TooltipPoint | null>(
      null,
    );

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

  function handlePlayerFilter(
    steamId: string,
  ) {
    setSelectedPlayer(steamId);
    setHoveredPoint(null);
    setPinnedPoint(null);
  }

  function handlePeriodChange(
    newPeriod: Period,
  ) {
    setPeriod(newPeriod);
    setHoveredPoint(null);
    setPinnedPoint(null);
  }

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

  const chartSeries: ChartSeries[] =
    visiblePlayers.map((player) => {
      const color =
        getPlayerColor(
          player.steamId,
        );

      const points =
        player.history.map(
          (
            point,
            pointIndex,
          ) => {
            const previous =
              pointIndex > 0
                ? player.history[
                    pointIndex - 1
                  ]
                : null;

            return {
              ...point,

              x: getX(
                new Date(
                  point.date,
                ).getTime(),
              ),

              y: getY(
                point.rating,
              ),

              change:
                previous
                  ? point.rating -
                    previous.rating
                  : null,
            };
          },
        );

      const path =
        points
          .map(
            (
              point,
              index,
            ) =>
              `${
                index === 0
                  ? "M"
                  : "L"
              } ${point.x} ${point.y}`,
          )
          .join(" ");

      return {
        player,
        color,
        points,
        path,
      };
    });

  const interactionPoints:
    TooltipPoint[] =
    chartSeries.flatMap(
      (series) =>
        series.points.map(
          (point) => ({
            playerName:
              series.player.name,

            steamId:
              series.player.steamId,

            color:
              series.color,

            point,

            x:
              point.x,

            y:
              point.y,

            change:
              point.change,
          }),
        ),
    );

  const activeTooltip =
    pinnedPoint ??
    hoveredPoint;

  function getSvgCoordinates(
    event: ReactPointerEvent<SVGRectElement>,
  ) {
    const svg =
      event.currentTarget
        .ownerSVGElement;

    if (!svg) {
      return null;
    }

    const rect =
      svg.getBoundingClientRect();

    if (
      rect.width === 0 ||
      rect.height === 0
    ) {
      return null;
    }

    return {
      x:
        ((event.clientX -
          rect.left) /
          rect.width) *
        width,

      y:
        ((event.clientY -
          rect.top) /
          rect.height) *
        height,
    };
  }

  function findNearestPoint(
    x: number,
    y: number,
  ) {
    let nearest:
      TooltipPoint | null =
      null;

    let nearestDistance =
      Number.POSITIVE_INFINITY;

    for (
      const point of
      interactionPoints
    ) {
      const dx =
        point.x - x;

      const dy =
        point.y - y;

      const distance =
        Math.hypot(
          dx,
          dy,
        );

      if (
        distance <
        nearestDistance
      ) {
        nearestDistance =
          distance;

        nearest =
          point;
      }
    }

    if (
      nearestDistance >
      HOVER_DISTANCE
    ) {
      return null;
    }

    return nearest;
  }

  function handleChartPointerMove(
    event: ReactPointerEvent<SVGRectElement>,
  ) {
    if (pinnedPoint) {
      return;
    }

    const coordinates =
      getSvgCoordinates(event);

    if (!coordinates) {
      return;
    }

    const nearest =
      findNearestPoint(
        coordinates.x,
        coordinates.y,
      );

    setHoveredPoint(
      nearest,
    );
  }

  function handleChartPointerLeave() {
    if (!pinnedPoint) {
      setHoveredPoint(null);
    }
  }

  function handleChartPointerDown(
    event: ReactPointerEvent<SVGRectElement>,
  ) {
    const coordinates =
      getSvgCoordinates(event);

    if (!coordinates) {
      return;
    }

    const nearest =
      findNearestPoint(
        coordinates.x,
        coordinates.y,
      );

    if (!nearest) {
      setPinnedPoint(null);
      setHoveredPoint(null);

      return;
    }

    setPinnedPoint(
      (current) =>
        current?.point.id ===
          nearest.point.id &&
        current.steamId ===
          nearest.steamId
          ? null
          : nearest,
    );

    setHoveredPoint(
      nearest,
    );
  }

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
              handlePlayerFilter(
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
                  handlePlayerFilter(
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
                handlePeriodChange(
                  option,
                )
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

                {chartSeries.map(
                  (series) => {
                    const isActiveSeries =
                      activeTooltip
                        ?.steamId ===
                      series.player
                        .steamId;

                    const isMuted =
                      activeTooltip !==
                        null &&
                      !isActiveSeries;

                    return (
                      <g
                        key={
                          series.player
                            .steamId
                        }
                        className={`rating-history__series ${
                          isActiveSeries
                            ? "rating-history__series--active"
                            : ""
                        } ${
                          isMuted
                            ? "rating-history__series--muted"
                            : ""
                        }`}
                      >
                        <path
                          d={
                            series.path
                          }
                          fill="none"
                          stroke={
                            series.color
                          }
                          strokeWidth={
                            isActiveSeries
                              ? 4
                              : 3
                          }
                          strokeLinejoin="round"
                          strokeLinecap="round"
                          className="rating-history__line"
                        />

                        {series.points.map(
                          (point) => {
                            const isActivePoint =
                              activeTooltip
                                ?.point
                                .id ===
                                point.id &&
                              activeTooltip
                                .steamId ===
                                series
                                  .player
                                  .steamId;

                            return (
                              <g
                                key={
                                  point.id
                                }
                                className={`rating-history__point ${
                                  isActivePoint
                                    ? "rating-history__point--active"
                                    : ""
                                }`}
                              >
                                {isActivePoint && (
                                  <circle
                                    cx={
                                      point.x
                                    }
                                    cy={
                                      point.y
                                    }
                                    r="12"
                                    fill={
                                      series.color
                                    }
                                    className="rating-history__point-halo"
                                  />
                                )}

                                <circle
                                  cx={
                                    point.x
                                  }
                                  cy={
                                    point.y
                                  }
                                  r={
                                    isActivePoint
                                      ? 7
                                      : 4.5
                                  }
                                  fill="#050912"
                                  stroke={
                                    series.color
                                  }
                                  strokeWidth={
                                    isActivePoint
                                      ? 4
                                      : 3
                                  }
                                  className="rating-history__point-dot"
                                />
                              </g>
                            );
                          },
                        )}
                      </g>
                    );
                  },
                )}

                <rect
                  x={
                    paddingLeft -
                    HOVER_DISTANCE
                  }
                  y={
                    paddingTop -
                    HOVER_DISTANCE
                  }
                  width={
                    width -
                    paddingLeft -
                    paddingRight +
                    HOVER_DISTANCE *
                      2
                  }
                  height={
                    height -
                    paddingTop -
                    paddingBottom +
                    HOVER_DISTANCE *
                      2
                  }
                  fill="transparent"
                  className="rating-history__interaction-layer"
                  onPointerMove={
                    handleChartPointerMove
                  }
                  onPointerLeave={
                    handleChartPointerLeave
                  }
                  onPointerDown={
                    handleChartPointerDown
                  }
                />

                {activeTooltip && (
                  <RatingTooltip
                    tooltip={
                      activeTooltip
                    }
                    width={
                      width
                    }
                  />
                )}
              </svg>
            </div>

            <div className="rating-history__legend">
              {visiblePlayers.map(
                (player) => {
                  const color =
                    getPlayerColor(
                      player.steamId,
                    );

                  const isActive =
                    activeTooltip
                      ?.steamId ===
                    player.steamId;

                  const isMuted =
                    activeTooltip !==
                      null &&
                    !isActive;

                  return (
                    <div
                      key={
                        player.steamId
                      }
                      className={`rating-history__legend-item ${
                        isActive
                          ? "rating-history__legend-item--active"
                          : ""
                      } ${
                        isMuted
                          ? "rating-history__legend-item--muted"
                          : ""
                      }`}
                    >
                      <span
                        className="rating-history__legend-dot"
                        style={{
                          background:
                            color,
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
                  );
                },
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

type RatingTooltipProps = {
  tooltip: TooltipPoint;
  width: number;
};

function RatingTooltip({
  tooltip,
  width,
}: RatingTooltipProps) {
  const tooltipWidth = 190;
  const tooltipHeight = 104;

  const offset = 14;

  let tooltipX =
    tooltip.x + offset;

  if (
    tooltipX +
      tooltipWidth >
    width - 10
  ) {
    tooltipX =
      tooltip.x -
      tooltipWidth -
      offset;
  }

  let tooltipY =
    tooltip.y -
    tooltipHeight -
    offset;

  if (tooltipY < 10) {
    tooltipY =
      tooltip.y +
      offset;
  }

  const outcome =
    getOutcomeLabel(
      tooltip.point.outcome,
    );

  const changeClass =
    tooltip.change !== null &&
    tooltip.change > 0
      ? "rating-history__tooltip-change--positive"
      : tooltip.change !== null &&
          tooltip.change < 0
        ? "rating-history__tooltip-change--negative"
        : "";

  const outcomeClass =
    outcome === "WIN"
      ? "rating-history__tooltip-outcome--win"
      : outcome === "LOSS"
        ? "rating-history__tooltip-outcome--loss"
        : outcome === "DRAW"
          ? "rating-history__tooltip-outcome--draw"
          : "";

  return (
    <g
      className="rating-history__tooltip"
      pointerEvents="none"
      transform={`translate(${tooltipX} ${tooltipY})`}
    >
      <rect
        width={
          tooltipWidth
        }
        height={
          tooltipHeight
        }
        rx="10"
        className="rating-history__tooltip-bg"
      />

      <circle
        cx="14"
        cy="17"
        r="4"
        fill={
          tooltip.color
        }
      />

      <text
        x="25"
        y="20"
        className="rating-history__tooltip-player"
      >
        {
          tooltip.playerName
        }
      </text>

      <text
        x="14"
        y="43"
        className="rating-history__tooltip-label"
      >
        CS RATING
      </text>

      <text
        x="14"
        y="63"
        className="rating-history__tooltip-rating"
      >
        {formatRating(
          tooltip.point.rating,
        )}
      </text>

      <text
        x="176"
        y="62"
        textAnchor="end"
        className={`rating-history__tooltip-change ${changeClass}`}
      >
        {formatRatingChange(
          tooltip.change,
        )}
      </text>

      <text
        x="14"
        y="85"
        className="rating-history__tooltip-meta"
      >
        {formatMapName(
          tooltip.point.mapName,
        )}
      </text>

      <text
        x="176"
        y="85"
        textAnchor="end"
        className={`rating-history__tooltip-outcome ${outcomeClass}`}
      >
        {outcome}
      </text>

      <text
        x="14"
        y="98"
        className="rating-history__tooltip-date"
      >
        {formatTooltipDate(
          tooltip.point.date,
        )}
      </text>
    </g>
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