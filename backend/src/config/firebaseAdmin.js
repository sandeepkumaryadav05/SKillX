// firebaseAdmin.js — Initializes the Firebase Admin SDK for server-side token verification.
// Requires FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY env vars.

import admin from 'firebase-admin';

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // The private key comes as a string with escaped newlines from env vars
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ?.replace(/\\n/g, '\n')
    .replace(/^\"|\"$/g, '');

  // Hard fail if any credential is missing — do not silently proceed with a broken SDK
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      `Firebase Admin missing credentials — ` +
      `projectId: ${!!projectId}, ` +
      `clientEmail: ${!!clientEmail}, ` +
      `privateKey: ${!!privateKey}, ` +
      `keyLength: ${privateKey?.length}`
    );
  }

  // Hard fail if key is structurally invalid (truncated, mis-pasted, or newlines not decoded)
  if (!privateKey.includes('-----BEGIN')) {
    throw new Error(
      `Firebase private key is malformed. ` +
      `Starts with: ${privateKey?.substring(0, 50)} | ` +
      `Length: ${privateKey?.length}`
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export const firebaseAuth = admin.auth();
export default admin;
