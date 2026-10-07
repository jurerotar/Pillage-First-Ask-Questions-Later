import { useSignIn } from '../hooks/use-sign-in';

export const SignInForm = ({
  onSignIn,
}: {
  onSignIn: (token: string) => void;
}) => {
  const signIn = useSignIn();

  return (
    <form
      className="login"
      onSubmit={(event) => {
        event.preventDefault();
        const token = String(
          new FormData(event.currentTarget).get('token'),
        ).trim();
        signIn.mutate(token, { onSuccess: () => onSignIn(token) });
      }}
    >
      <h2>Sign in</h2>
      <label htmlFor="token">Admin API token</label>
      <input
        id="token"
        name="token"
        type="password"
        autoComplete="off"
        required
        disabled={signIn.isPending}
      />
      <p className="muted">Your token is kept in memory for this session.</p>
      {signIn.error && <p role="alert">{signIn.error.message}</p>}
      <button
        type="submit"
        disabled={signIn.isPending}
      >
        {signIn.isPending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
};
