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
        <span>Direct quote pages on Yahoo Finance, Morningstar, Barron's, WSJ, and X's cashtag search.</span>
        <a href="https://github.com/taufiqxr/stocks-launcher">GitHub</a>
      </footer>
    </main>
  );
}
