# @pillage-first/bug-reporter-ui

This app contains the admin frontend for bug reports. It's built with React, Vite, React Router 8 and React Query.

## Local setup

Copy `.env.example` to `.env` and run these commands from the repository root:

```sh
npm install
npm run bug-reporter-ui --workspace=@pillage-first/bug-reporter-ui
```

Open `http://localhost:5176` and sign in with the API's `ADMIN_API_TOKEN`. The token is kept in memory and cleared when you sign out or reload the page.

Each report has an **Open** link to view its details, download its SQLite game world, close it or delete it.
Deleting a report also deletes its uploaded files. Closed reports remain available in the list.

### Configuration

`VITE_API_URL` sets the API URL. Use `https://bugs.pillagefirst.com` to connect to production.

The browser connects directly to the API. Set `ADMIN_ALLOWED_ORIGIN` to `http://localhost:5176` in the API's cPanel environment variables to allow local access.
When hosting the frontend, set it to the frontend's origin instead.

### Build

```sh
npm run build --workspace=@pillage-first/bug-reporter-ui
```

Serve `dist` as a static site. Configure the host to serve `index.html` for frontend routes, including `/reports/:reportId`.
