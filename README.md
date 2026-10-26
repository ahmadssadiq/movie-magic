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
