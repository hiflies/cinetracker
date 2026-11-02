import { useState } from 'react';
import type { User } from './AuthBar';
import type { MovieList } from './types';

type Props = {
  lists: MovieList[];
  activeId: number | null;
  user: User | null;
  onSelect: (id: number) => void;
  /** resolves to an error message, or null on success */
  onCreate: (name: string) => Promise<string | null>;
  onDelete: (list: MovieList) => void;
};

export default function ListBar({ lists, activeId, user, onSelect, onCreate, onDelete }: Props) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const active = lists.find((l) => l.id === activeId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = await onCreate(name);
    setError(err);
    if (!err) {
      setName('');
      setAdding(false);
    }
  };

  return (
    <div className="listbar">
      <div className="chips" role="tablist" aria-label="Movie lists">
        {lists.map((l) => (
          <button
            key={l.id}
            type="button"
            role="tab"
            aria-selected={l.id === activeId}
            className={`chip${l.id === activeId ? ' active' : ''}`}
            onClick={() => onSelect(l.id)}
          >
            {l.name} <span className="chip-count">{l.movieCount}</span>
          </button>
        ))}

        {user && !adding && (
          <button type="button" className="chip add" onClick={() => setAdding(true)}>
            + New list
          </button>
        )}
      </div>

      {user && adding && (
        <form className="new-list" onSubmit={submit}>
          <input
            autoFocus
            value={name}
            maxLength={100}
            placeholder="List name"
            onChange={(e) => setName(e.target.value)}
            aria-label="New list name"
          />
          <button type="submit" className="random-btn" disabled={!name.trim()}>
            Create
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => {
              setAdding(false);
              setName('');
              setError(null);
            }}
          >
            Cancel
          </button>
          {error && <span className="status error">{error}</span>}
        </form>
      )}

      {user && active && !active.system && (
        <button type="button" className="ghost-btn danger" onClick={() => onDelete(active)}>
          Delete list
        </button>
      )}
    </div>
  );
}
