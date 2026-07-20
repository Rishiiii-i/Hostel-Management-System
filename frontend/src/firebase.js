// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCjciJ_pYfab5D0k8XAvjxtjOhqMTil-O0",
    authDomain: "hostel-management-system-78566.firebaseapp.com",
    projectId: "hostel-management-system-78566",
    storageBucket: "hostel-management-system-78566.firebasestorage.app",
    messagingSenderId: "634350989098",
    appId: "1:634350989098:web:0b2ca4acd3ee80aae9f853",
    measurementId: "G-ZF9LWGBTZ8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
