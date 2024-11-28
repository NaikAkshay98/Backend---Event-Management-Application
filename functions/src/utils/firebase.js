// firebase.js

// Import Firebase Admin SDK
const admin = require("firebase-admin");

// Initialize Firebase Admin App
admin.initializeApp();

// Initialize Firestore Database
const db = admin.firestore();

// Check for Emulator Configuration
if (process.env.FIREBASE_EMULATOR === "true") {
  db.settings({
    host: "localhost:8080", // Host for Firestore emulator
    ssl: false, // Disable SSL for local emulator
  });
  console.log("Connected to Firestore emulator.");
} else {
  console.log("Connected to Firestore production environment.");
}

module.exports = { admin, db };
