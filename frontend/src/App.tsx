import { useEffect, useMemo, useState } from 'react';
import './App.css';

type Movie = {
  rank: number;
  name: string;
  duration: string;
  rating: number;
  image: string;
  year: number;
};

type Sort = 'rank' | 'rating' | 'year' | 'name';

export default function App() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('rank');

  useEffect(() => {
    fetch('/api/movies')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(res.statusText))))
      .then(setMovies)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q ? movies.filter((m) => m.name.toLowerCase().includes(q)) : movies;
    return [...filtered].sort((a, b) => {
      switch (sort) {
        case 'rating':
          return b.rating - a.rating || a.rank - b.rank;
        case 'year':
          return b.year - a.year || a.rank - b.rank;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return a.rank - b.rank;
      }
    });
  }, [movies, query, sort]);

  return (
    <main className="page">
      <header className="header">
        <h1>CineTracker</h1>
        <p>IMDb Top 250 movies</p>
      </header>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Search movies…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search movies"
        />
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort by">
          <option value="rank">Rank</option>
          <option value="rating">Rating</option>
          <option value="year">Newest</option>
          <option value="name">Name</option>
        </select>
        <span className="count">{visible.length} movies</span>
      </div>

      {loading && <p className="status">Loading…</p>}
      {error && <p className="status error">Could not load movies: {error}</p>}
      {!loading && !error && visible.length === 0 && <p className="status">No movies match.</p>}

      <ul className="grid">
        {visible.map((m) => (
          <li key={m.rank} className="card">
            <div className="poster">
              <img src={m.image} alt={`${m.name} poster`} loading="lazy" referrerPolicy="no-referrer" />
              <span className="rank">#{m.rank}</span>
            </div>
            <div className="info">
              <h2 title={m.name}>{m.name}</h2>
              <div className="meta">
                <span>{m.year}</span>
                <span>{m.duration}</span>
                <span className="rating">★ {m.rating.toFixed(1)}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
