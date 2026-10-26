import { auth } from '../firebase.js';

export async function requireAuth(req, res, next) {
  const header = req.get('Authorization') || '';
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());

  if (!match) {
    return res.status(401).json({
      error: 'Missing or invalid authorization token'
    });
  }

  try {
    const decodedToken = await auth.verifyIdToken(match[1]);

    req.user = decodedToken;

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid or expired Firebase ID token'
    });
  }
}