import "./About.css";

function About() {
  return (
    <section className="about" id="about">
      <div className="about__top">
        <span className="about__eyebrow">
          ABOUT / PROBABLY
        </span>

        <span className="about__index">
          EST. FOR NO PARTICULAR REASON
        </span>
      </div>

      <div className="about__grid">
        <div className="about__title">
          <h2>
            TWO PLAYERS.
            <br />
            ONE QUESTION.
          </h2>
        </div>

        <div className="about__content">
          <p className="about__lead">
            Ka Hviss? E-Sports is a highly professional
            Counter-Strike 2 organisation consisting of
            exactly two people.
          </p>

          <p>
            We play Premier. We play Competitive. Sometimes
            we even play together. Results may vary.
          </p>

          <p>
            What began as two players queueing CS2 has,
            for reasons still under investigation, resulted
            in an esports brand, a live match feed and an
            unnecessarily professional website.
          </p>

          <div className="about__quote">
            <span>MISSION STATEMENT</span>

            <strong>
              WE PLAY CS.
              <br />
              KA HVISS?
            </strong>
          </div>
        </div>
      </div>

      <div className="about__ticker">
        <span>KA HVISS?</span>
        <span>COUNTER-STRIKE 2</span>
        <span>QUESTIONABLE AIM</span>
        <span>UNREASONABLE CONFIDENCE</span>
      </div>
    </section>
  );
}

export default About;