import { useState } from "react";

import PlayerProfile from "./PlayerProfile";
import { players } from "../data/players";
import type { Player } from "../data/players";

import "./Team.css";

function Team() {
  const [selectedPlayer, setSelectedPlayer] =
    useState<Player | null>(null);

  function handlePlayerClick(player: Player) {
    setSelectedPlayer((current) =>
      current?.steamId === player.steamId
        ? null
        : player,
    );
  }

  return (
    <section className="team" id="teams">
      <div className="team__header">
        <div>
          <span className="team__eyebrow">
            CS2 / CURRENT ROSTER
          </span>

          <h2>MEET THE TEAM.</h2>
        </div>

        <div className="team__meta">
          <span className="team__count">
            {String(players.length).padStart(2, "0")} PLAYERS
          </span>

          <span className="team__hint">
            SELECT A PLAYER
          </span>
        </div>
      </div>

      <div className="team__rail">
        <div className="team__grid">
          {players.map((player) => {
            const isSelected =
              selectedPlayer?.steamId === player.steamId;

            return (
              <button
                type="button"
                className={`player-card ${
                  isSelected
                    ? "player-card--selected"
                    : ""
                }`}
                key={player.steamId}
                onClick={() => handlePlayerClick(player)}
                aria-expanded={isSelected}
              >
                <div className="player-card__image">
                  <img
                    src={player.image}
                    alt={player.name}
                  />

                  <span className="player-card__number">
                    {player.number}
                  </span>

                  {isSelected && (
                    <span className="player-card__active">
                      ACTIVE
                    </span>
                  )}
                </div>

                <div className="player-card__info">
                  <div>
                    <span className="player-card__role">
                      {player.role}
                    </span>

                    <h3>{player.name}</h3>
                  </div>

                  <span className="player-card__arrow">
                    {isSelected ? "↓" : "↗"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedPlayer && (
        <PlayerProfile
          key={selectedPlayer.steamId}
          player={selectedPlayer}
        />
      )}
    </section>
  );
}

export default Team;