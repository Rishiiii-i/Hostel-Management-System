import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize Firebase Cloud Messaging conditionally based on browser support
let messagingPromise = null;
const getMessagingInstance = async () => {
    try {
        const supported = await isSupported();
        if (supported) {
            return getMessaging(app);
        } else {
            console.warn('[FCM] Firebase Cloud Messaging is not supported in this browser environment.');
            return null;
        }
    } catch (err) {
        console.error('[FCM] Error checking FCM support:', err);
        return null;
    }
};

export { app, auth, firebaseConfig, getMessagingInstance };

