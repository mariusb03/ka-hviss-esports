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
            ONE TEAM.
            <br />
            SEVEN PROBLEMS.
          </h2>
        </div>

        <div className="about__content">
          <p className="about__lead">
            Ka Hviss? E-Sports is a highly
            professional Counter-Strike 2
            organisation consisting of seven
            remarkably qualified individuals.
          </p>

          <p>
            We play Premier. We play Competitive.
            Occasionally, several of us even manage
            to queue at the same time.
          </p>

          <p>
            What started as people playing CS2 has,
            for reasons still under investigation,
            resulted in a seven-player roster, live
            Leetify integration and an unnecessarily
            professional esports website.
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