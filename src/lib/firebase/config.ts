import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

class FirebaseClient {
  private static instance: FirebaseClient;
  private app: FirebaseApp;
  private auth: Auth;
  private firestore: Firestore;

  private constructor() {
    const config = {
        apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
        authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
        measurementId: import.meta.env.PUBLIC_FIREBASE_MEASUREMENT_ID
    };

    this.app = initializeApp(config);
    this.auth = getAuth(this.app);
    this.firestore = getFirestore(this.app);
  }

  public static getInstance(): FirebaseClient {
    if (!FirebaseClient.instance) {
      FirebaseClient.instance = new FirebaseClient();
    }
    return FirebaseClient.instance;
  }

  getAuth(): Auth {
    return this.auth;
  }

  getFirestore(): Firestore {
    return this.firestore;
  }
}

export const firebase = FirebaseClient.getInstance();