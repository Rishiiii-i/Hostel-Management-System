/** * firebase admin sdk configuration * safely initializes firebase admin sdk for sending fcm push notifications */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let firebaseAdminApp = null;

function initializeFirebaseAdmin() {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return existingApps[0];
  }

  try {
    let credential = null;

    // 1 check if full json credential string is stored in env
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      credential = cert(serviceAccount);
      console.log('[FirebaseAdmin] Initialized via FIREBASE_SERVICE_ACCOUNT_JSON env variable.');
    } 
    // 2 check if custom file path is specified in env
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const resolvedPath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      if (fs.existsSync(resolvedPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
        credential = cert(serviceAccount);
        console.log(`[FirebaseAdmin] Initialized via file path: ${resolvedPath}`);
      }
    } 
    // 3 fallback to serviceaccountkeyjson in backend directory
    else {
      const defaultPath = path.resolve(__dirname, '../serviceAccountKey.json');
      if (fs.existsSync(defaultPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(defaultPath, 'utf8'));
        credential = cert(serviceAccount);
        console.log('[FirebaseAdmin] Initialized via default serviceAccountKey.json.');
      }
    }

    if (!credential) {
      console.warn('[FirebaseAdmin] Warning: No Firebase service account credentials found.');
      return null;
    }

    firebaseAdminApp = initializeApp({ credential });
    return firebaseAdminApp;
  } catch (error) {
    console.error('[FirebaseAdmin] Failed to initialize Firebase Admin SDK:', error.message);
    return null;
  }
}

const adminInstance = initializeFirebaseAdmin();

export { firebaseAdminApp, adminInstance, getMessaging };
