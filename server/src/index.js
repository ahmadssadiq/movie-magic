import 'dotenv/config';
import app from './app.js';

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`Movie Magic API running on http://localhost:${port}`);
  if (!process.env.TMDB_API_KEY) {
    console.warn('Warning: TMDB_API_KEY is not set. Copy .env.example to .env and add your key.');
  }
});
