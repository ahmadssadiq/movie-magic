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
      normalizeDetails.js  builds the details page shape (cast, crew, trailer)
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

## List endpoints

| Endpoint | What it returns |
| --- | --- |
| `GET /api/genres?type=movie` | Genre ids and names (`movie` or `tv`) |
| `GET /api/trending?type=all&window=week` | Trending titles (`all`, `movie`, `tv`; `day` or `week`) |
| `GET /api/lists/:list` | `popular-movies`, `popular-tv`, `upcoming`, `top-rated` |

TMDb responses are cached in memory for 10 minutes.

## Details endpoint

### `GET /api/title/:type/:id`

Everything for one movie or TV show, from a single TMDb call
(`append_to_response=credits,videos,similar,reviews`).

| Param | Values |
| --- | --- |
| `type` | `movie` or `tv` |
| `id` | TMDb id, e.g. `27205` (Inception), `1396` (Breaking Bad) |

Returns the same fields as a search result, plus:

```js
{ genres: [{ id, name }], tagline, status,
  cast: [{ id, name, character, profilePath }],      // top 12, in billing order
  crew: [{ id, name, job }],                         // Director, Writer, Screenplay; Creator for TV
  trailer: { key, name, url } | null,                // first YouTube trailer
  similar: [ /* search-result items, up to 12 */ ],
  tmdbReviews: [{ author, content, rating, url }],
  runtime,                                           // movies, in minutes
  seasons, episodes }                                // TV only
```

Trailer embed: `https://www.youtube.com/embed/${trailer.key}`

Unknown id returns `404`; a type other than `movie` or `tv` returns `400`.

## Database
See [docs/schema.md](docs/schema.md) for the Firestore schema (users, favorites, reviews).