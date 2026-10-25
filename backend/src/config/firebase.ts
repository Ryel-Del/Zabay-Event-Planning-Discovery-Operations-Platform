import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

export async function verifyFirebaseIdentity(idToken: string) {
  const raw = process.env.FIREBASE_PROJECT_ID || 'zabay-87086';
  const projectId = raw.trim().replace(/^["']|["']$/g, '');
  if (!projectId) throw new Error('Firebase project is not configured');
  const app = getApps()[0] || initializeApp({ projectId });
  const claims = await getAuth(app).verifyIdToken(idToken);
  if (!claims.uid) {
    throw new Error('Invalid Firebase identity claims');
  }
  return {
    uid: claims.uid,
    email: (claims.email || `${claims.uid}@google.com`).trim().toLowerCase(),
    name: claims.name || claims.email?.split('@')[0] || 'Google User',
    picture: claims.picture || '',
  };
}
