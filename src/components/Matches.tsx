import "./Matches.css";

const matches = [
  {
    opponent: "TBD",
    event: "Upcoming CS2 Match",
    date: "TBA",
    time: "TBA",
    status: "UPCOMING",
  },
  {
    opponent: "TBD",
    event: "Practice Match",
    date: "TBA",
    time: "TBA",
    status: "UPCOMING",
  },
];

function Matches() {
  return (
    <section className="matches" id="matches">
      <div className="matches__header">
        <div>
          <span className="matches__eyebrow">CS2 / MATCHES</span>
          <h2>UP NEXT.</h2>
        </div>

        <span className="matches__status">READY WHEN YOU ARE</span>
      </div>

      <div className="matches__list">
        {matches.map((match, index) => (
          <article className="match-card" key={index}>
            <div className="match-card__meta">
              <span className="match-card__status">{match.status}</span>
              <span>{match.event}</span>
            </div>

            <div className="match-card__teams">
              <div>
                <span className="match-card__label">TEAM</span>
                <h3>KA HVISS?</h3>
              </div>

              <span className="match-card__vs">VS</span>

              <div className="match-card__opponent">
                <span className="match-card__label">OPPONENT</span>
                <h3>{match.opponent}</h3>
              </div>
            </div>

            <div className="match-card__schedule">
              <span>{match.date}</span>
              <span>{match.time}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Matches;