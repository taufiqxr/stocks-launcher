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
        <a href="https://github.com/taufiqxr/stocks-launcher" title="Each checked site opens on its direct quote page; your picks are remembered on this device">
          GitHub
        </a>
      </footer>
    </main>
  );
}
