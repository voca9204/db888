"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserProfile = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
// Cloud Function to create a user profile when a new user signs up
exports.createUserProfile = functions.auth.user().onCreate(async (user) => {
    var _a;
    try {
        const userRecord = await admin.auth().getUser(user.uid);
        // Create default user profile in Firestore
        await admin.firestore().collection("users").doc(user.uid).set({
            uid: user.uid,
            email: user.email || null,
            displayName: user.displayName || ((_a = user.email) === null || _a === void 0 ? void 0 : _a.split("@")[0]) || "User",
            role: "user",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Create default user settings
        await admin.firestore().collection("settings").doc(user.uid).set({
            userId: user.uid,
            theme: "light",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true };
    }
    catch (error) {
        console.error("Error creating user profile:", error);
        return { error: "Failed to create user profile" };
    }
});
//# sourceMappingURL=auth.js.map