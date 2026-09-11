import "./Navigation.css";

function Navigation() {
  return (
    <nav className="navigation">
      <a href="#home" className="navigation__brand">
        <span>KA HVISS?</span>
        <span>E-SPORTS</span>
      </a>

      <div className="navigation__links">
        <a href="#home">Home</a>
        <a href="#teams">Teams</a>
        <a href="#matches">Matches</a>
        <a href="#about">About</a>
      </div>
    </nav>
  );
}

export default Navigation;