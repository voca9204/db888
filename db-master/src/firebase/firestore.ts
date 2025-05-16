import { 
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
  Timestamp,
  DocumentData,
  DocumentReference
} from 'firebase/firestore';
import { firestore } from './config';

// Helper function to add a document to a collection with a custom ID
export const addDocument = async <T extends DocumentData>(
  collectionName: string,
  docId: string,
  data: T
): Promise<void> => {
  const docRef = doc(firestore, collectionName, docId);
  await setDoc(docRef, {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
};

// Helper function to add a document to a collection with auto-generated ID
export const addDocumentWithAutoId = async <T extends DocumentData>(
  collectionName: string,
  data: T
): Promise<DocumentReference<DocumentData>> => {
  const docRef = doc(collection(firestore, collectionName));
  await setDoc(docRef, {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
  return docRef;
};

// Helper function to get a document by ID
export const getDocument = async <T>(
  collectionName: string,
  docId: string
): Promise<T | null> => {
  const docRef = doc(firestore, collectionName, docId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as T;
  }
  
  return null;
};

// Helper function to get all documents in a collection
export const getDocuments = async <T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> => {
  const collectionRef = collection(firestore, collectionName);
  const q = query(collectionRef, ...constraints);
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  })) as T[];
};

// Helper function to update a document
export const updateDocument = async <T extends DocumentData>(
  collectionName: string,
  docId: string,
  data: Partial<T>
): Promise<void> => {
  const docRef = doc(firestore, collectionName, docId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now()
  });
};

// Helper function to delete a document
export const deleteDocument = async (
  collectionName: string,
  docId: string
): Promise<void> => {
  const docRef = doc(firestore, collectionName, docId);
  await deleteDoc(docRef);
};

// Define collection names as constants
export const COLLECTION_NAMES = {
  USERS: 'users',
  CONNECTIONS: 'connections',
  QUERY_TEMPLATES: 'queryTemplates',
  SETTINGS: 'settings'
};

// Types for database collections
export interface DBConnection {
  id?: string;
  userId: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string; // This should be encrypted
  database: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface QueryTemplate {
  id?: string;
  userId: string;
  connectionId: string;
  name: string;
  description: string;
  query: string;
  parameters?: Record<string, any>;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface UserSettings {
  id?: string;
  userId: string;
  theme: 'light' | 'dark';
  defaultConnectionId?: string;
  recentQueries?: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Helper functions for specific collections
export const getUserConnections = async (userId: string): Promise<DBConnection[]> => {
  return getDocuments<DBConnection>(
    COLLECTION_NAMES.CONNECTIONS, 
    [where('userId', '==', userId), orderBy('name')]
  );
};

export const getUserQueryTemplates = async (userId: string): Promise<QueryTemplate[]> => {
  return getDocuments<QueryTemplate>(
    COLLECTION_NAMES.QUERY_TEMPLATES, 
    [where('userId', '==', userId), orderBy('createdAt', 'desc')]
  );
};

export const getUserSettings = async (userId: string): Promise<UserSettings | null> => {
  return getDocument<UserSettings>(COLLECTION_NAMES.SETTINGS, userId);
};

export const updateUserSettings = async (
  userId: string, 
  settings: Partial<UserSettings>
): Promise<void> => {
  const currentSettings = await getUserSettings(userId);
  
  if (currentSettings) {
    // Update existing settings
    await updateDocument<UserSettings>(COLLECTION_NAMES.SETTINGS, userId, settings);
  } else {
    // Create new settings
    await addDocument<UserSettings>(COLLECTION_NAMES.SETTINGS, userId, {
      userId,
      theme: 'light',
      ...settings
    });
  }
};
