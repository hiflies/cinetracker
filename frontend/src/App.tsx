import { useEffect, useMemo, useState } from 'react';
import AuthBar, { type User } from './AuthBar';
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
type Filter = 'all' | 'watched' | 'unwatched';

export default function App() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('rank');
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [watched, setWatched] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<Filter>('all');
  const [picked, setPicked] = useState<Movie | null>(null);

  // logged-in users get suggestions from movies they haven't watched yet
  const pool = useMemo(
    () => (user ? movies.filter((m) => !watched.has(m.rank)) : movies),
    [movies, watched, user],
  );

  const pickRandom = () => {
    if (pool.length === 0) return;
    setPicked((prev) => {
      let next: Movie;
      do {
        next = pool[Math.floor(Math.random() * pool.length)];
      } while (pool.length > 1 && next.rank === prev?.rank);
      return next;
    });
  };

  useEffect(() => {
    fetch('/api/movies')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(res.statusText))))
      .then(setMovies)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setAuthReady(true));
  }, []);

  useEffect(() => {
    if (!user) {
      setWatched(new Set());
      setFilter('all');
      return;
    }
    fetch('/api/watched')
      .then((res) => (res.ok ? res.json() : []))
      .then((ranks: number[]) => setWatched(new Set(ranks)))
      .catch(() => setWatched(new Set()));
  }, [user]);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  // posters stay hidden until the logged-in user has marked the movie as watched
  const hidden = (rank: number) => !!user && !watched.has(rank);

  const toggleWatched = async (rank: number) => {
    const wasWatched = watched.has(rank);
    const apply = (on: boolean) =>
      setWatched((prev) => {
        const next = new Set(prev);
        if (on) next.add(rank);
        else next.delete(rank);
        return next;
      });
    apply(!wasWatched);
    try {
      const res = await fetch(`/api/watched/${rank}`, { method: wasWatched ? 'DELETE' : 'PUT' });
      if (!res.ok) throw new Error(res.statusText);
    } catch {
      apply(wasWatched);
    }
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = movies.filter(
      (m) =>
        (!q || m.name.toLowerCase().includes(q)) &&
        (filter === 'all' || (filter === 'watched') === watched.has(m.rank)),
    );
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
  }, [movies, query, sort, filter, watched]);

  return (
    <main className="page">
      <header className="header">
        <div>
          <h1>CineTracker</h1>
          <p>IMDb Top 250 movies</p>
        </div>
        <AuthBar user={user} ready={authReady} onLogout={logout} />
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
        {user && (
          <select value={filter} onChange={(e) => setFilter(e.target.value as Filter)} aria-label="Filter by watched">
            <option value="all">All movies</option>
            <option value="watched">Watched ({watched.size})</option>
            <option value="unwatched">Not watched</option>
          </select>
        )}
        <button type="button" className="random-btn" onClick={pickRandom} disabled={pool.length === 0}
          title={pool.length === 0 && movies.length > 0 ? 'You have watched every movie!' : undefined}>
          Random movie
        </button>
        <span className="count">{visible.length} movies</span>
      </div>

      {loading && <p className="status">Loading…</p>}
      {error && <p className="status error">Could not load movies: {error}</p>}
      {!loading && !error && visible.length === 0 && <p className="status">No movies match.</p>}

      <ul className="grid">
        {visible.map((m) => (
          <li key={m.rank} className={`card${watched.has(m.rank) ? ' watched' : ''}`}>
            <div className={`poster${hidden(m.rank) ? ' unrevealed' : ''}`}>
              <img src={m.image} alt={`${m.name} poster`} loading="lazy" referrerPolicy="no-referrer" />
              <span className="rank">#{m.rank}</span>
              {hidden(m.rank) && <span className="hidden-mark">?</span>}
              {watched.has(m.rank) && <span className="seen-badge">✓ Watched</span>}
            </div>
            <div className="info">
              <h2 title={m.name}>{m.name}</h2>
              <div className="meta">
                <span>{m.year}</span>
                <span>{m.duration}</span>
                <span className="rating">★ {m.rating.toFixed(1)}</span>
              </div>
              {user && (
                <button
                  type="button"
                  className={`watch-btn${watched.has(m.rank) ? ' on' : ''}`}
                  onClick={() => toggleWatched(m.rank)}
                >
                  {watched.has(m.rank) ? 'Unmark watched' : 'Mark as watched'}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {picked && (
        <div className="overlay" onClick={() => setPicked(null)}>
          <div className="modal" role="dialog" aria-label="Random movie" onClick={(e) => e.stopPropagation()}>
            <img src={picked.image} alt={`${picked.name} poster`} referrerPolicy="no-referrer" />
            <div className="modal-body">
              <span className="rank-label">#{picked.rank} on IMDb Top 250</span>
              <h2>{picked.name}</h2>
              <div className="meta">
                <span>{picked.year}</span>
                <span>{picked.duration}</span>
                <span className="rating">★ {picked.rating.toFixed(1)}</span>
              </div>
              <div className="actions">
                {user && (
                  <button
                    type="button"
                    className={`watch-btn modal-watch${watched.has(picked.rank) ? ' on' : ''}`}
                    onClick={() => toggleWatched(picked.rank)}
                  >
                    {watched.has(picked.rank) ? '✓ Watched' : 'Mark as watched'}
                  </button>
                )}
                <button type="button" className="random-btn" onClick={pickRandom} disabled={pool.length === 0}>
                  Pick another
                </button>
                <button type="button" className="ghost-btn" onClick={() => setPicked(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
