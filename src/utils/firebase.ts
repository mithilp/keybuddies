import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
	apiKey: process.env.FIREBASE_API,
	authDomain: `${process.env.PROJECT_ID}.firebaseapp.com`,
	projectId: process.env.PROJECT_ID,
	storageBucket: `${process.env.PROJECT_ID}.appspot.com`,
	messagingSenderId: process.env.SENDER_ID,
	appId: process.env.APP_ID,
	measurementId: process.env.MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export const analytics = isSupported().then((yes) =>
	yes ? getAnalytics(app) : null
);
