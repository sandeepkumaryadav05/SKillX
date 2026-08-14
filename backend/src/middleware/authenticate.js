// authenticate.js — Verifies Firebase ID tokens on incoming requests.
// Attaches the decoded token to req.user and the MongoDB profile to req.userProfile.
// Every protected route should use this middleware (applied globally in index.js).

import { firebaseAuth } from '../config/firebaseAdmin.js';
import UserProfile from '../models/UserProfile.js';

/**
 * Extracts and verifies the Firebase ID token from the Authorization header.
 * On success, sets:
 *   - req.user   = decoded Firebase token ({ uid, email, ... })
 *   - req.userProfile = MongoDB UserProfile document (may be null for brand-new users)
 */
export const authenticate = async (req, res, next) => {
  let idToken = null;
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Authentication required. Provide a valid Firebase ID token in the Authorization header.',
      });
    }

    idToken = authHeader.split('Bearer ')[1];

    // Block string "undefined"/"null" — sent when frontend calls API before auth is ready
    if (!idToken || idToken === 'undefined' || idToken === 'null') {
      console.error('[Auth] Invalid token received:', idToken);
      return res.status(401).json({
        error: 'Invalid token format',
        received: idToken,
      });
    }

    // Cryptographically verify the token with Firebase
    const decodedToken = await firebaseAuth.verifyIdToken(idToken);

    // Attach verified identity to request
    req.user = decodedToken;

    // Look up the MongoDB profile (may not exist yet during first signup)
    const userProfile = await UserProfile.findOne({ email: decodedToken.email });
    req.userProfile = userProfile;

    next();
  } catch (err) {
    console.error('[Auth] Token verification failed');
    console.error('[Auth] Error code:', err.code);
    console.error('[Auth] Error message:', err.message);
    console.error('[Auth] Token preview:', idToken?.substring(0, 30));
    return res.status(401).json({ error: err.code });
  }
};
