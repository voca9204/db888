import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Cloud Function to create a user profile when a new user signs up
export const createUserProfile = functions.auth.user().onCreate(async (user) => {
  try {
    const userRecord = await admin.auth().getUser(user.uid);
    
    // Create default user profile in Firestore
    await admin.firestore().collection("users").doc(user.uid).set({
      uid: user.uid,
      email: user.email || null,
      displayName: user.displayName || user.email?.split("@")[0] || "User",
      role: "user", // Default role
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // Create default user settings
    await admin.firestore().collection("settings").doc(user.uid).set({
      userId: user.uid,
      theme: "light",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    return {success: true};
  } catch (error) {
    console.error("Error creating user profile:", error);
    return {error: "Failed to create user profile"};
  }
});
