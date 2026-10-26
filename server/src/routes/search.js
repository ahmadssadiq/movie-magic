import { Router } from 'express';
import { tmdbGet } from '../tmdb.js';
import { normalizePage } from '../normalize.js';

const router = Router();

// Our simple sort names, mapped to TMDb's sort_by values per media type.
// TMDb calls the release date field differently for movies and TV.
const SORTS = {
  popularity: { movie: 'popularity.desc', tv: 'popularity.desc' },
  rating: { movie: 'vote_average.desc', tv: 'vote_average.desc' },
  newest: { movie: 'primary_release_date.desc', tv: 'first_air_date.desc' },
};

const SEARCH_TYPES = ['multi', 'movie', 'tv'];
const DISCOVER_TYPES = ['movie', 'tv'];
const MAX_YEAR = new Date().getFullYear() + 5;

// Throwing this sends a 400 with { error } through the app's error handler
function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

function checkOneOf(name, value, allowed) {
  if (!allowed.includes(value)) {
    throw badRequest(`${name} must be one of: ${allowed.join(', ')}`);
  }
}

// Optional whole number in a range. Returns undefined when not given.
function checkInt(name, value, min, max) {
  if (value === undefined || value === '') return undefined;
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw badRequest(`${name} must be a whole number from ${min} to ${max}`);
  }
  return n;
}

// GET /api/search?q=inception&type=movie&year=2010&page=1
// type: multi (default, movies + TV), movie, or tv
router.get('/search', async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  if (!q) throw badRequest('q is required, e.g. /api/search?q=inception');
  if (q.length > 100) throw badRequest('q must be 100 characters or fewer');

  const type = req.query.type || 'multi';
  checkOneOf('type', type, SEARCH_TYPES);
  const year = checkInt('year', req.query.year, 1874, MAX_YEAR);
  const page = checkInt('page', req.query.page, 1, 500) ?? 1;

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

// GET /api/discover?type=movie&genre=878&year=2014&minRating=8&sort=rating&page=1
// Browse without a search term, filtered by genre, release year and rating.
router.get('/discover', async (req, res) => {
  const type = req.query.type || 'movie';
  checkOneOf('type', type, DISCOVER_TYPES);
  const sort = req.query.sort || 'popularity';
  checkOneOf('sort', sort, Object.keys(SORTS));
  const year = checkInt('year', req.query.year, 1874, MAX_YEAR);
  const page = checkInt('page', req.query.page, 1, 500) ?? 1;

  const genre = req.query.genre;
  if (genre !== undefined && !/^\d+(,\d+)*$/.test(genre)) {
    throw badRequest('genre must be a genre id or comma-separated ids, e.g. 878 or 28,12');
  }

  let minRating;
  if (req.query.minRating !== undefined && req.query.minRating !== '') {
    minRating = Number(req.query.minRating);
    if (Number.isNaN(minRating) || minRating < 0 || minRating > 10) {
      throw badRequest('minRating must be a number from 0 to 10');
    }
  }

  const params = {
    page,
    include_adult: false,
    sort_by: SORTS[sort][type],
    with_genres: genre, // one id, or several separated by commas
  };

  if (year && type === 'movie') params.primary_release_year = year;
  if (year && type === 'tv') params.first_air_date_year = year;

  if (minRating) {
    params['vote_average.gte'] = minRating;
    // Without a vote floor, a film with two 10/10 votes beats real classics
    params['vote_count.gte'] = 100;
  }

  // Sorting by rating only makes sense for titles enough people have rated
  if (sort === 'rating' && !params['vote_count.gte']) params['vote_count.gte'] = 200;

  // "Newest" should mean already released, not announced for 2030
  if (sort === 'newest') {
    const today = new Date().toISOString().slice(0, 10);
    if (type === 'movie') params['primary_release_date.lte'] = today;
    else params['first_air_date.lte'] = today;
  }

  const data = await tmdbGet(`/discover/${type}`, params);
  res.json(normalizePage(data, type));
});

export default router;
