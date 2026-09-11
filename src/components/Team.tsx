import "./Team.css";

const players = [
  {
    name: "Brotato",
    image: "/players/brotato.png",
    role: "CS2 PLAYER",
    number: "01",
  },
  {
    name: "Selnes",
    image: "/players/selnes.png",
    role: "CS2 PLAYER",
    number: "02",
  },
];

function Team() {
  return (
    <section className="team" id="teams">
      <div className="team__header">
        <div>
          <span className="team__eyebrow">CS2 / CURRENT ROSTER</span>
          <h2>MEET THE TEAM.</h2>
        </div>

        <span className="team__count">02 PLAYERS</span>
      </div>

      <div className="team__grid">
        {players.map((player) => (
          <article className="player-card" key={player.name}>
            <div className="player-card__image">
              <img src={player.image} alt={player.name} />

              <span className="player-card__number">
                {player.number}
              </span>
            </div>

            <div className="player-card__info">
              <div>
                <span className="player-card__role">
                  {player.role}
                </span>

                <h3>{player.name}</h3>
              </div>

              <span className="player-card__arrow">↗</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Team;