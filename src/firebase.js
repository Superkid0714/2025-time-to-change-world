// Firebase 설정 파일
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyAaWz_5rrVKrnHPkfztwMWa-Fsqp-U2XLc",
  authDomain: "time-management-checker.firebaseapp.com",
  projectId: "time-management-checker",
  storageBucket: "time-management-checker.firebasestorage.app",
  messagingSenderId: "645477126698",
  appId: "1:645477126698:web:e44806ddd869b196126953",
  measurementId: "G-WTFH768YJJ",
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firestore 데이터베이스
export const db = getFirestore(app);

// Analytics
export const analytics = getAnalytics(app);
