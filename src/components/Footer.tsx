import "./Footer.css";

function Footer() {
  const year =
    new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="footer__brand">
          <span>KA HVISS?</span>

          <small>E-SPORTS</small>
        </div>

        <a
          href="#home"
          className="footer__back"
        >
          BACK TO TOP ↑
        </a>
      </div>

      <div className="footer__statement">
        <span>COUNTER-STRIKE 2</span>

        <h2>
          SEE YOU
          <br />
          IN THE QUEUE.
        </h2>
      </div>

      <div className="footer__bottom">
        <span>
          © {year} KA HVISS? E-SPORTS
        </span>

        <span>
          SEVEN PLAYERS. STILL ZERO INVESTORS.
        </span>

        <span>
          ÅLESUND / NORWAY
        </span>
      </div>
    </footer>
  );
}

export default Footer;