// TMDb uses different field names for movies and TV shows (title vs name,
// release_date vs first_air_date). These helpers turn both into one shape so
// the frontend never has to care which one it got.

export function normalizeItem(raw, fallbackType) {
  const mediaType = raw.media_type || fallbackType;
  return {
    id: raw.id,
    mediaType,
    title: raw.title || raw.name || '',
    overview: raw.overview || '',
    posterPath: raw.poster_path || null,
    backdropPath: raw.backdrop_path || null,
    releaseDate: raw.release_date || raw.first_air_date || null,
    rating: raw.vote_average ?? 0,
    voteCount: raw.vote_count ?? 0,
    genreIds: raw.genre_ids || [],
  };
}

export function normalizePage(data, fallbackType) {
  return {
    page: data.page,
    totalPages: data.total_pages,
    totalResults: data.total_results,
    results: (data.results || [])
      // Multi-search also returns people; we only list movies and TV shows
      .filter((item) => (item.media_type || fallbackType) !== 'person')
      .map((item) => normalizeItem(item, fallbackType)),
  };
}
