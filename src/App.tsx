import Navigation from "./components/Navigation";
import Hero from "./components/Hero";
import Team from "./components/Team";
import Matches from "./components/Matches";
import About from "./components/About";
import Footer from "./components/Footer";

function App() {
  return (
    <>
      <Navigation />

      <main>
        <Hero />
        <Team />
        <Matches />
        <About />
      </main>

      <Footer />
    </>
  );
}

export default App;