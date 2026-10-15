import { Button } from 'app/components/ui/button';
import { useSignIn } from '../hooks/use-sign-in';

export const SignInForm = ({
  onSignIn,
}: {
  onSignIn: (token: string) => void;
}) => {
  const signIn = useSignIn();

  return (
    <form
      className="flex max-w-md flex-col gap-4 rounded-lg border bg-card p-4 sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        const token = String(
          new FormData(event.currentTarget).get('token'),
        ).trim();
        signIn.mutate(token, { onSuccess: () => onSignIn(token) });
      }}
    >
      <h2 className="text-xl font-semibold leading-tight">Sign in</h2>
      <label htmlFor="token">Admin API token</label>
      <input
        className="w-full rounded-md border border-input bg-background px-3 py-2 focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
        id="token"
        name="token"
        type="password"
        autoComplete="off"
        required
        disabled={signIn.isPending}
      />
      <p className="text-sm text-muted-foreground">
        Your token is remembered in this browser until you sign out.
      </p>
      {signIn.error && (
        <p
          className="text-destructive"
          role="alert"
        >
          {signIn.error.message}
        </p>
      )}
      <Button
        variant="outline"
        type="submit"
        disabled={signIn.isPending}
      >
        {signIn.isPending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
};
