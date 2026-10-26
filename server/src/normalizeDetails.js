// Turns one TMDb details response (fetched with
// append_to_response=credits,videos,similar,reviews) into our Details shape.
// It starts from the same fields as a search result, so the frontend can treat
// a details page and a list card the same way, and adds everything else on top.

import { normalizeItem } from './normalize.js';

const CAST_LIMIT = 12;
const SIMILAR_LIMIT = 12;

// Crew jobs worth showing. TV creators come from created_by, not the crew list.
const KEY_JOBS = ['Director', 'Writer', 'Screenplay'];

function pickCast(credits) {
  return (credits?.cast || [])
    .slice()
    .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))
    .slice(0, CAST_LIMIT)
    .map((person) => ({
      id: person.id,
      name: person.name,
      character: person.character || '',
      profilePath: person.profile_path || null,
    }));
}

function pickCrew(raw, mediaType) {
  const crew = [];
  const seen = new Set();
  const add = (person, job) => {
    // TMDb often lists the same person twice for one job (e.g. Writer twice)
    const key = `${person.id}:${job}`;
    if (seen.has(key)) return;
    seen.add(key);
    crew.push({ id: person.id, name: person.name, job });
  };

  if (mediaType === 'tv') {
    for (const person of raw.created_by || []) add(person, 'Creator');
  }
  for (const person of raw.credits?.crew || []) {
    if (KEY_JOBS.includes(person.job)) add(person, person.job);
  }
  return crew;
}

// First YouTube video of type Trailer, or null
function pickTrailer(videos) {
  const video = (videos?.results || []).find(
    (v) => v.site === 'YouTube' && v.type === 'Trailer'
  );
  if (!video) return null;
  return {
    key: video.key,
    name: video.name,
    url: `https://www.youtube.com/watch?v=${video.key}`,
  };
}

// TMDb's own reviews, shown next to our users' reviews later
function pickTmdbReviews(reviews) {
  return (reviews?.results || []).map((review) => ({
    author: review.author || review.author_details?.username || 'Anonymous',
    content: review.content || '',
    rating: review.author_details?.rating ?? null,
    url: review.url || null,
  }));
}

export function normalizeDetails(raw, mediaType) {
  const details = {
    ...normalizeItem(raw, mediaType),
    // Details responses have genres as objects instead of genre_ids
    genreIds: (raw.genres || []).map((g) => g.id),
    genres: (raw.genres || []).map((g) => ({ id: g.id, name: g.name })),
    tagline: raw.tagline || '',
    status: raw.status || null,
    cast: pickCast(raw.credits),
    crew: pickCrew(raw, mediaType),
    trailer: pickTrailer(raw.videos),
    similar: (raw.similar?.results || [])
      .slice(0, SIMILAR_LIMIT)
      .map((item) => normalizeItem(item, mediaType)),
    tmdbReviews: pickTmdbReviews(raw.reviews),
  };

  if (mediaType === 'movie') {
    details.runtime = raw.runtime ?? null; // minutes
  } else {
    details.seasons = raw.number_of_seasons ?? null;
    details.episodes = raw.number_of_episodes ?? null;
  }

  return details;
}
