import { Router } from 'express';
import { tmdbGet } from '../tmdb.js';
import { normalizePage } from '../normalize.js';

const router = Router();

// GET /api/search?q=inception&type=movie&year=2010&page=1
// type: multi (default, movies + TV), movie, or tv
router.get('/search', async (req, res) => {
  const q = req.query.q;
  const type = req.query.type || 'multi';
  const year = req.query.year;
  const page = req.query.page || 1;

  const params = { query: q, page, include_adult: false };
  // TMDb names the year filter differently for movies and TV
  if (year && type === 'movie') params.primary_release_year = year;
  if (year && type === 'tv') params.first_air_date_year = year;

  const data = await tmdbGet(`/search/${type}`, params);
  const result = normalizePage(data, type === 'multi' ? undefined : type);

  // /search/multi has no year filter, so filter its results here
  if (year && type === 'multi') {
    result.results = result.results.filter((item) => item.releaseDate?.startsWith(String(year)));
  }

  res.json(result);
});

export default router;
