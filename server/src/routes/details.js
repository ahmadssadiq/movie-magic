import { Router } from 'express';
import { tmdbGet } from '../tmdb.js';
import { normalizeDetails } from '../normalizeDetails.js';

const router = Router();

const TYPES = ['movie', 'tv'];

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

// GET /api/title/movie/27205   (Inception)
// GET /api/title/tv/1396       (Breaking Bad)
// One TMDb call brings back the title plus its cast, videos, similar titles and reviews.
router.get('/title/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  if (!TYPES.includes(type)) throw badRequest('type must be movie or tv');
  if (!/^\d+$/.test(id)) throw badRequest('id must be a TMDb id (a whole number)');

  let raw;
  try {
    raw = await tmdbGet(`/${type}/${id}`, {
      append_to_response: 'credits,videos,similar,reviews',
    });
  } catch (err) {
    if (err.status === 404) err.message = `No ${type} found with id ${id}`;
    throw err;
  }

  res.json(normalizeDetails(raw, type));
});

export default router;
