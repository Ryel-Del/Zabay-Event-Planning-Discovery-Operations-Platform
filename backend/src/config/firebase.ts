import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

export async function verifyFirebaseIdentity(idToken: string) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error('Firebase project is not configured');
  const app = getApps()[0] || initializeApp({ projectId });
  const claims = await getAuth(app).verifyIdToken(idToken);
  if (claims.aud !== projectId || claims.iss !== `https://securetoken.google.com/${projectId}` ||
      !claims.uid || !claims.email || claims.email_verified !== true ||
      claims.firebase?.sign_in_provider !== 'google.com') {
    throw new Error('Invalid Firebase identity claims');
  }
  return { uid: claims.uid, email: claims.email.trim().toLowerCase(), name: claims.name || claims.email.split('@')[0], picture: claims.picture || '' };
}
