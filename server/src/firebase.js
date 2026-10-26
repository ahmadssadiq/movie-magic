import 'dotenv/config';

import {
  initializeApp,
  applicationDefault,
  getApps,
  getApp
} from 'firebase-admin/app';

import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const firebaseApp = getApps().length
  ? getApp()
  : initializeApp({
      credential: applicationDefault()
    });

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);