# Database schema (Firestore)

Movie and TV data comes live from TMDb. Firestore only stores what TMDb doesn't have: our users, their reviews and their favorites, linked by TMDb id.

Status: designed for the midpoint; Firebase is connected in weeks 6-7.

## users/{uid}
One document per account. `uid` comes from Firebase Authentication.

| Field | Type | Notes |
| --- | --- | --- |
| displayName | string | Shown on the user's reviews |
| email | string | Login email |
| createdAt | timestamp | When the account was created |
| alertPrefs | map | `{ newReleases: boolean, genreIds: number[] }` |

## users/{uid}/favorites/{mediaType}_{tmdbId}
Subcollection, one document per saved title, e.g. `movie_27205`.
The document id prevents saving the same title twice.

| Field | Type |
| --- | --- |
| tmdbId | number |
| mediaType | "movie" or "tv" |
| title | string |
| posterPath | string |
| addedAt | timestamp |

These match the fields our search API returns, so a search result can be saved
as a favorite directly.

## reviews/{autoId}
One document per review. Kept top-level so all reviews for a title come from
one query (`where tmdbId == 27205`).

| Field | Type | Notes |
| --- | --- | --- |
| tmdbId | number | Which title |
| mediaType | "movie" or "tv" | |
| uid | string | Author, links to users/{uid} |
| displayName | string | Copied from the user so reviews load without extra lookups |
| rating | number | 1 to 10 |
| text | string | The review |
| createdAt | timestamp | |

## Access rules
- Anyone can read reviews; only the author can edit or delete their own.
- Only the owner can read or write their favorites.
- Writes require a signed-in user (Firebase Authentication: email/password and Google).