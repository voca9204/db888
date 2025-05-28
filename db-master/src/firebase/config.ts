import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// 직접 Firebase 설정 정보 추가
const firebaseConfig = {
  apiKey: "AIzaSyD2RY02pN2RrhT8Qt2hTSEilRqV4JAbCR0",
  authDomain: "db888-67827.firebaseapp.com",
  projectId: "db888-67827",
  storageBucket: "db888-67827.firebasestorage.app",
  messagingSenderId: "888497598316",
  appId: "1:888497598316:web:ad0cb0364d906c26658d49"
};

// Log application information
console.log('🚀 DB Master App - Firebase Config Override');

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);
const firestore = db; // firestore.ts에서 사용하는 이름으로 Export

// Functions와 Storage 초기화 (에러 처리 추가)
let functions;
let storage;

try {
  // Initialize Functions with region parameter
  functions = getFunctions(app); // 기본 리전 사용 (us-central1)
  
  // Initialize Storage
  storage = getStorage(app);
} catch (error) {
  console.error('Firebase services initialization error:', error);
  // 오류 발생 시 null 값으로 초기화
  functions = null;
  storage = null;
}

// 에뮬레이터 사용 여부 (기본값: false)
const USE_EMULATORS = false;

// 에뮬레이터 설정
const emulatorConfig = {
  authHost: 'http://localhost:9099',
  firestoreHost: 'localhost:8080',
  functionsHost: 'localhost:5001',
  storageHost: 'localhost:9199',
};

// Connect to emulators in development (functions, storage가 초기화된 경우에만)
if (USE_EMULATORS && functions && storage) {
  console.log('🔧 Using Firebase emulators for local development');
  
  // Auth emulator
  connectAuthEmulator(auth, emulatorConfig.authHost);
  
  // Firestore emulator
  connectFirestoreEmulator(db, emulatorConfig.firestoreHost.split(':')[0], parseInt(emulatorConfig.firestoreHost.split(':')[1]));
  
  // Functions emulator
  connectFunctionsEmulator(
    functions, 
    'localhost', 
    parseInt(emulatorConfig.functionsHost.split(':')[1])
  );
  
  // Storage emulator
  connectStorageEmulator(
    storage, 
    'localhost', 
    parseInt(emulatorConfig.storageHost.split(':')[1])
  );
}

// 외부로 내보내기
export { app, auth, db, firestore, functions, storage };
export default app;