# MovieMatch

MovieMatch is a React/Vite MVP for discovering TMDB movies and saving them to personal testapi.io lists. Profile selection is a convenience for this prototype, not authentication.

## Run locally

~~~bash
npm install
copy .env.example .env.local
npm run dev
~~~

Fill .env.local with your own collection URLs and TMDB key, then restart Vite:

~~~env
VITE_TESTAPI_USERS_URL=
VITE_TESTAPI_LISTS_URL=
VITE_TESTAPI_SAVED_MOVIES_URL=
VITE_TMDB_API_KEY=
~~~

.env.local is ignored by Git. VITE_TMDB_API_KEY is exposed to the browser bundle, so this configuration is only suitable for local educational use, not production.

## Features and data

- **Discover Movies:** TMDB title search, genre/minimum-rating discovery filters, mood recommendations, pagination, posters, and TMDB attribution. Title-search genre/rating filters apply only to the displayed TMDB search page.
- **My Movies:** create, rename and delete lists; save TMDB movies; set Want to Watch/Watched status and a personal rating.
- **Users:** create, select, edit, and delete profiles. A user must have no lists before deletion, preventing orphaned data.

testapi.io collections use these relationships:

- users: id, name, email
- movieLists: id, userId, name
- savedMovies: id, listId, tmdbId, status, rating

## Test the main flow

1. Start the app and open **Users**; create and select a profile.
2. Open **My Movies**, create a list, and select it.
3. Open **Discover Movies**, search or choose a mood, then click **Save to My Movies**.
4. Back in **My Movies**, save the pending film to the selected list and edit its status or rating.
5. Refresh to confirm data is read again from testapi.io.

If an environment value is missing or an API request fails, the relevant feature shows an actionable error rather than using mock data. Standalone development pages remain available at /demos/users.html, /demos/movie-lists.html, and /demos/movie-discovery.html.

Personal notes are not stored by the current savedMovies collection. To support them, add one nullable String column named notes to that collection, then add it back to the saved-movie request payloads and UI.

## Checks

~~~bash
npm run lint
npm run build
~~~
