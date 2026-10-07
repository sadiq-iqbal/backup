const EXERCISE_DB_KEY = '7714cfdf32msh0b3a9ddabc22219p17efe5jsnb8fdaa68cce7';
const EXERCISE_DB_HOST = 'exercisedb.p.rapidapi.com';
const EXERCISE_DB_BASE = 'https://exercisedb.p.rapidapi.com';

const YOUTUBE_KEY = '1a0bd224b6msh6251d7fe90be911p196ab1jsndf97f7ecc3ec';
const YOUTUBE_HOST = 'youtube-search-and-download.p.rapidapi.com';

const exerciseHeaders = {
  'x-rapidapi-key': EXERCISE_DB_KEY,
  'x-rapidapi-host': EXERCISE_DB_HOST,
};

const youtubeHeaders = {
  'x-rapidapi-key': YOUTUBE_KEY,
  'x-rapidapi-host': YOUTUBE_HOST,
};

export const searchExercisesByName = async (name, limit = 15) => {
  const res = await fetch(
    `${EXERCISE_DB_BASE}/exercises/name/${encodeURIComponent(name.toLowerCase())}?limit=${limit}&offset=0`,
    { headers: exerciseHeaders }
  );
  if (!res.ok) throw new Error('Failed to search exercises');
  return res.json();
};

export const getExercisesByBodyPart = async (bodyPart, limit = 20) => {
  const res = await fetch(
    `${EXERCISE_DB_BASE}/exercises/bodyPart/${encodeURIComponent(bodyPart)}?limit=${limit}&offset=0`,
    { headers: exerciseHeaders }
  );
  if (!res.ok) throw new Error('Failed to fetch exercises');
  return res.json();
};

export const getExerciseById = async (id) => {
  const res = await fetch(
    `${EXERCISE_DB_BASE}/exercises/exercise/${id}`,
    { headers: exerciseHeaders }
  );
  if (!res.ok) throw new Error('Exercise not found');
  return res.json();
};

export const getAllBodyParts = async () => {
  const res = await fetch(`${EXERCISE_DB_BASE}/exercises/bodyPartList`, { headers: exerciseHeaders });
  if (!res.ok) throw new Error('Failed to fetch body parts');
  return res.json();
};

export const getTopExercises = async (limit = 20) => {
  const res = await fetch(
    `${EXERCISE_DB_BASE}/exercises?limit=${limit}&offset=0`,
    { headers: exerciseHeaders }
  );
  if (!res.ok) throw new Error('Failed to fetch exercises');
  return res.json();
};

export const searchYouTubeVideos = async (query) => {
  const res = await fetch(
    `https://youtube-search-and-download.p.rapidapi.com/search?query=${encodeURIComponent(query)}&type=v&sort=r`,
    { headers: youtubeHeaders }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.contents?.filter(c => c.video)?.slice(0, 3) || [];
};
