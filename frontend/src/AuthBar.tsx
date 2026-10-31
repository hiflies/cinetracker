export type User = { id: number; email: string; name: string; picture: string | null };

type Props = { user: User | null; ready: boolean; onLogout: () => void };

export default function AuthBar({ user, ready, onLogout }: Props) {
  if (!ready) return null;

  if (user) {
    return (
      <div className="auth">
        {user.picture && <img src={user.picture} alt="" className="avatar" referrerPolicy="no-referrer" />}
        <span>{user.name}</span>
        <button type="button" className="ghost-btn" onClick={onLogout}>
          Log out
        </button>
      </div>
    );
  }

  return (
    <a className="google-btn" href="/api/auth/google">
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.5 17.7 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z" />
        <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
        <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.3 0-11.6-4-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
      </svg>
      Sign in with Google
    </a>
  );
}
