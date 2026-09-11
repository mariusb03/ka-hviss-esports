import "./Hero.css";

function Hero() {
  return (
    <section className="hero" id="home">
      <div className="hero__content">
        <span className="hero__eyebrow">KA HVISS? E-SPORTS</span>

        <h1>
          WE PLAY.
          <br />
          YOU QUESTION IT.
        </h1>

        <p>
          A Norwegian CS2 team built on questionable decisions, good vibes and
          an unreasonable belief that the next game is ours.
        </p>

        <div className="hero__actions">
          <a href="#teams" className="hero__button hero__button--primary">
            Meet the team
          </a>

          <a href="#matches" className="hero__button hero__button--secondary">
            View matches
          </a>
        </div>
      </div>

      <div className="hero__visual">
        <img src="/logo.png" alt="Ka Hviss? E-Sports logo" />
      </div>
    </section>
  );
}

export default Hero;
