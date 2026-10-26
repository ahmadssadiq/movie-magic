import { Router } from 'express';
import { tmdbGet } from '../tmdb.js';
import { normalizePage } from '../normalize.js';

const router = Router();

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

// GET /api/genres?type=movie   (movie or tv)
router.get('/genres', async (req, res) => {
  const type = req.query.type || 'movie';
  if (!['movie', 'tv'].includes(type)) throw badRequest('type must be movie or tv');
  const data = await tmdbGet(`/genre/${type}/list`);
  res.json({ genres: data.genres });
});

// GET /api/trending?type=all&window=week
router.get('/trending', async (req, res) => {
  const type = req.query.type || 'all';
  const window = req.query.window || 'week';
  if (!['all', 'movie', 'tv'].includes(type)) throw badRequest('type must be all, movie or tv');
  if (!['day', 'week'].includes(window)) throw badRequest('window must be day or week');
  const data = await tmdbGet(`/trending/${type}/${window}`);
  res.json(normalizePage(data, type === 'all' ? undefined : type));
});

// GET /api/lists/:list   (popular-movies, popular-tv, upcoming, top-rated)
const LISTS = {
  'popular-movies': ['/movie/popular', 'movie'],
  'popular-tv': ['/tv/popular', 'tv'],
  upcoming: ['/movie/upcoming', 'movie'],
  'top-rated': ['/movie/top_rated', 'movie'],
};

router.get('/lists/:list', async (req, res) => {
  const entry = LISTS[req.params.list];
  if (!entry) {
    const err = new Error(`Unknown list. Use one of: ${Object.keys(LISTS).join(', ')}`);
    err.status = 404;
    throw err;
  }
  const [path, type] = entry;
  const data = await tmdbGet(path, { page: req.query.page || 1 });
  res.json(normalizePage(data, type));
});

export default router;