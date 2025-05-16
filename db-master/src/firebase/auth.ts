// Mock Firebase implementation for development
// User roles
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

// User profile structure
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  createdAt: number;
}

// Mock Firebase User type
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

// Mock Firebase UserCredential type
export interface UserCredential {
  user: User;
}

// Sign up with email and password
export const signUp = async (
  email: string, 
  password: string, 
  displayName: string
): Promise<UserCredential> => {
  // Return mock credential
  return {
    user: {
      uid: 'mock-uid',
      email,
      displayName
    }
  };
};

// Sign in with email and password
export const signIn = async (email: string, password: string): Promise<UserCredential> => {
  // Return mock credential
  return {
    user: {
      uid: 'mock-uid',
      email,
      displayName: 'Mock User'
    }
  };
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<UserCredential> => {
  // Return mock credential
  return {
    user: {
      uid: 'mock-uid',
      email: 'mock@example.com',
      displayName: 'Mock Google User'
    }
  };
};

// Sign out
export const signOut = async (): Promise<void> => {
  // Do nothing in mock
};

// Reset password
export const resetPassword = async (email: string): Promise<void> => {
  // Do nothing in mock
};

// Get user profile from Firestore
export const getUserProfile = async (user: User): Promise<UserProfile | null> => {
  // Return mock profile
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    role: UserRole.USER,
    createdAt: Date.now()
  };
};
