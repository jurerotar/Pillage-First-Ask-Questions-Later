import { useIsMutating, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, Route, Routes } from 'react-router';
import { SignInForm } from './components/sign-in-form';
import { ReportPage } from './reports/report-page';
import { ReportsPage } from './reports/reports-page';

const AUTH_TOKEN_STORAGE_KEY = 'bug-reporter-ui.auth-token';

export const App = () => {
  const [token, setToken] = useState(
    () => localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ?? '',
  );
  const queryClient = useQueryClient();
  const isMutating = useIsMutating() > 0;

  return (
    <main>
      <header>
        <h1>
          <Link to="/">Bug reports</Link>
        </h1>
        {token && (
          <button
            type="button"
            disabled={isMutating}
            onClick={() => {
              localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
              queryClient.clear();
              setToken('');
            }}
          >
            Sign out
          </button>
        )}
      </header>
      {token ? (
        <Routes>
          <Route
            path="/"
            element={<ReportsPage token={token} />}
          />
          <Route
            path="/reports/:reportId"
            element={<ReportPage token={token} />}
          />
          <Route
            path="*"
            element={
              <p>
                Page not found. <Link to="/">Back to reports</Link>
              </p>
            }
          />
        </Routes>
      ) : (
        <SignInForm
          onSignIn={(token) => {
            localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
            setToken(token);
          }}
        />
      )}
    </main>
  );
};
