import { useEffect, useState } from 'react';

type Health = { status: string; db: string };

export default function App() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(res.statusText))))
      .then(setHealth)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <main>
      <h1>CineTracker</h1>
      {error && <p>API error: {error}</p>}
      {health && <pre>{JSON.stringify(health, null, 2)}</pre>}
      {!error && !health && <p>Loading…</p>}
    </main>
  );
}
