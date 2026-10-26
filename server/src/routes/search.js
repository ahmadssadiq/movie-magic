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

// GET /api/discover?type=movie&genre=878&year=2014&minRating=8&page=1
// Browse without a search term, filtered by genre, release year and rating.
router.get('/discover', async (req, res) => {
  const type = req.query.type || 'movie';
  const { genre, year, minRating } = req.query;
  const page = req.query.page || 1;

  const params = {
    page,
    include_adult: false,
    sort_by: 'popularity.desc',
    with_genres: genre, // one id, or several separated by commas
  };

  if (year && type === 'movie') params.primary_release_year = year;
  if (year && type === 'tv') params.first_air_date_year = year;

  if (minRating) {
    params['vote_average.gte'] = minRating;
    // Without a vote floor, a film with two 10/10 votes beats real classics
    params['vote_count.gte'] = 100;
  }

  const data = await tmdbGet(`/discover/${type}`, params);
  res.json(normalizePage(data, type));
});

export default router;
