import Launcher from "./Launcher";

export default function App() {
  return (
    <main className="page">
      <header className="masthead">
        <h1 className="wordmark">Stocks Launcher</h1>
        <p className="tagline">One box. Every research tab.</p>
      </header>
      <Launcher />
      <footer className="foot">
        <span>Twelve research sites, each opened on its direct quote page. Your picks are remembered on this device.</span>
        <a href="https://github.com/taufiqxr/stocks-launcher">GitHub</a>
      </footer>
    </main>
  );
}
