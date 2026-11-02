import { useEffect, useMemo, useState } from 'react';
import AuthBar, { type User } from './AuthBar';
import ListBar from './ListBar';
import type { Movie, MovieList } from './types';
import './App.css';

type Sort = 'position' | 'rating' | 'year' | 'name';
type Filter = 'all' | 'watched' | 'unwatched';

export default function App() {
  const [lists, setLists] = useState<MovieList[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('position');
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [watched, setWatched] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<Filter>('all');
  const [picked, setPicked] = useState<Movie | null>(null);

  // logged-in users get suggestions from movies they haven't watched yet
  const pool = useMemo(
    () => (user ? movies.filter((m) => !watched.has(m.id)) : movies),
    [movies, watched, user],
  );

  const pickRandom = () => {
    if (pool.length === 0) return;
    setPicked((prev) => {
      let next: Movie;
      do {
        next = pool[Math.floor(Math.random() * pool.length)];
      } while (pool.length > 1 && next.id === prev?.id);
      return next;
    });
  };

  const loadLists = () =>
    fetch('/api/lists')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(res.statusText))))
      .then((data: MovieList[]) => {
        setLists(data);
        // fall back to the first built-in list when nothing (or a now-hidden list) is selected
        setActiveId((cur) => (cur !== null && data.some((l) => l.id === cur) ? cur : (data[0]?.id ?? null)));
      })
      .catch((e: Error) => setError(e.message));

  // lists depend on who is logged in (own lists are only visible to their owner)
  useEffect(() => {
    if (authReady) loadLists();
  }, [authReady, user]);

  useEffect(() => {
    if (activeId === null) return;
    let stale = false;
    setLoading(true);
    setError(null);
    fetch(`/api/lists/${activeId}/movies`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(res.statusText))))
      .then((data: Movie[]) => !stale && setMovies(data))
      .catch((e: Error) => !stale && setError(e.message))
      .finally(() => !stale && setLoading(false));
    return () => {
      stale = true;
    };
  }, [activeId]);

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
      .then((ids: number[]) => setWatched(new Set(ids)))
      .catch(() => setWatched(new Set()));
  }, [user]);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  // posters stay hidden until the logged-in user has marked the movie as watched
  const hidden = (id: number) => !!user && !watched.has(id);

  const toggleWatched = async (id: number) => {
    const wasWatched = watched.has(id);
    const apply = (on: boolean) =>
      setWatched((prev) => {
        const next = new Set(prev);
        if (on) next.add(id);
        else next.delete(id);
        return next;
      });
    apply(!wasWatched);
    try {
      const res = await fetch(`/api/watched/${id}`, { method: wasWatched ? 'DELETE' : 'PUT' });
      if (!res.ok) throw new Error(res.statusText);
    } catch {
      apply(wasWatched);
    }
  };

  const activeList = lists.find((l) => l.id === activeId);
  const isSystem = activeList?.system ?? true;
  const ownLists = lists.filter((l) => !l.system);

  const createList = async (rawName: string) => {
    const res = await fetch('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: rawName }),
    });
    if (!res.ok) return ((await res.json().catch(() => null))?.message as string) ?? res.statusText;
    const created: MovieList = await res.json();
    await loadLists();
    setActiveId(created.id);
    return null;
  };

  const deleteList = async (list: MovieList) => {
    if (!window.confirm(`Delete the list "${list.name}"?`)) return;
    const res = await fetch(`/api/lists/${list.id}`, { method: 'DELETE' });
    if (!res.ok) return;
    setActiveId(null);
    await loadLists();
  };

  const addToList = async (listId: number, movieId: number) => {
    const res = await fetch(`/api/lists/${listId}/movies/${movieId}`, { method: 'PUT' });
    if (res.ok) loadLists();
  };

  const removeFromList = async (movieId: number) => {
    if (activeId === null) return;
    const res = await fetch(`/api/lists/${activeId}/movies/${movieId}`, { method: 'DELETE' });
    if (!res.ok) return;
    setMovies((prev) => prev.filter((m) => m.id !== movieId));
    setPicked((p) => (p?.id === movieId ? null : p));
    loadLists();
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = movies.filter(
      (m) =>
        (!q || m.name.toLowerCase().includes(q)) &&
        (filter === 'all' || (filter === 'watched') === watched.has(m.id)),
    );
    return [...filtered].sort((a, b) => {
      switch (sort) {
        case 'rating':
          return b.rating - a.rating || a.position - b.position;
        case 'year':
          return b.year - a.year || a.position - b.position;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return a.position - b.position;
      }
    });
  }, [movies, query, sort, filter, watched]);

  return (
    <main className="page">
      <header className="header">
        <div>
          <h1>CineTracker</h1>
          <p>Track the movies you have watched</p>
        </div>
        <AuthBar user={user} ready={authReady} onLogout={logout} />
      </header>

      <ListBar
        lists={lists}
        activeId={activeId}
        user={user}
        onSelect={setActiveId}
        onCreate={createList}
        onDelete={deleteList}
      />

      <div className="toolbar">
        <input
          type="search"
          placeholder="Search movies…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search movies"
        />
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort by">
          <option value="position">List order</option>
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
      {!loading && !error && movies.length === 0 && !isSystem && (
        <p className="status">This list is empty. Use “Add to list” on a movie in Top 250.</p>
      )}
      {!loading && !error && movies.length > 0 && visible.length === 0 && <p className="status">No movies match.</p>}

      <ul className="grid">
        {visible.map((m) => (
          <li key={m.id} className={`card${watched.has(m.id) ? ' watched' : ''}`}>
            <div className={`poster${hidden(m.id) ? ' unrevealed' : ''}`}>
              <img src={m.image} alt={`${m.name} poster`} loading="lazy" referrerPolicy="no-referrer" />
              {isSystem && <span className="rank">#{m.position}</span>}
              {hidden(m.id) && <span className="hidden-mark">?</span>}
              {watched.has(m.id) && <span className="seen-badge">✓ Watched</span>}
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
                  className={`watch-btn${watched.has(m.id) ? ' on' : ''}`}
                  onClick={() => toggleWatched(m.id)}
                >
                  {watched.has(m.id) ? 'Unmark watched' : 'Mark as watched'}
                </button>
              )}
              {user && isSystem && ownLists.length > 0 && (
                <select
                  className="add-select"
                  value=""
                  aria-label={`Add ${m.name} to a list`}
                  onChange={(e) => addToList(Number(e.target.value), m.id)}
                >
                  <option value="" disabled>
                    + Add to list…
                  </option>
                  {ownLists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              )}
              {user && !isSystem && (
                <button type="button" className="watch-btn" onClick={() => removeFromList(m.id)}>
                  Remove from list
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
              <span className="rank-label">
                {isSystem ? `#${picked.position} in ${activeList?.name}` : activeList?.name}
              </span>
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
                    className={`watch-btn modal-watch${watched.has(picked.id) ? ' on' : ''}`}
                    onClick={() => toggleWatched(picked.id)}
                  >
                    {watched.has(picked.id) ? '✓ Watched' : 'Mark as watched'}
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
