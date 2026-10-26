# Movie Magic

A web app for discovering, browsing and reviewing movies and TV shows, powered by
[The Movie Database (TMDb) API](https://developer.themoviedb.org/docs/getting-started).

## Project structure

```
movie-magic/
  server/            Node + Express API (port 4000)
    src/
      index.js       starts the server
      app.js         Express app and route mounting
      tmdb.js        TMDb API client
      normalize.js   converts TMDb results into our response shapes
      routes/        one file per group of endpoints
  client/            React frontend (coming in weeks 5-6)
```

## Running the backend

1. Get a free TMDb key: themoviedb.org > Settings > API.
2. Set up and start the server:

```bash
cd server
npm install
cp .env.example .env     # then paste your TMDb key into .env
npm run dev
```

3. Check it works: http://localhost:4000/api/health

## Search and filter endpoints

All responses use one shape for movies and TV shows:

```js
{ page, totalPages, totalResults,
  results: [{ id, mediaType, title, overview, posterPath, backdropPath,
              releaseDate, rating, voteCount, genreIds }] }
```

Posters: `https://image.tmdb.org/t/p/w342${posterPath}`

### `GET /api/search`

Search by title.

| Param | Required | Values |
| --- | --- | --- |
| `q` | yes | search text, up to 100 characters |
| `type` | no | `multi` (default, movies and TV), `movie`, `tv` |
| `year` | no | release year, e.g. `2010` |
| `page` | no | 1 to 500, default 1 |

Example: `/api/search?q=inception&type=movie&year=2010`

### `GET /api/discover`

Browse without a search term.

| Param | Required | Values |
| --- | --- | --- |
| `type` | no | `movie` (default), `tv` |
| `genre` | no | TMDb genre id, or several separated by commas (`878` = Science Fiction, `28,12` = Action and Adventure) |
| `year` | no | release year |
| `minRating` | no | 0 to 10; only titles with at least 100 votes count |
| `sort` | no | `popularity` (default), `rating`, `newest` |
| `page` | no | 1 to 500, default 1 |

Example: `/api/discover?type=movie&genre=878&minRating=8&sort=rating`

Bad input returns `400` with `{ "error": "..." }`.
