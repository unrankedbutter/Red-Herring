/*
 * RED HERRING — public configuration.
 *
 * To enable real accounts (including Google sign-in) and cloud saves:
 *  1. Create a Firebase project at https://console.firebase.google.com
 *  2. Enable Authentication -> Sign-in method -> Email/Password AND Google.
 *  3. Create a Firestore database (production mode is fine).
 *  4. Add a Web app, then paste its config values below.
 *  5. In Firestore rules, allow authenticated users to read/write only their
 *     own document at /users/{uid}. Example:
 *
 *     rules_version = '2';
 *     service cloud.firestore {
 *       match /databases/{database}/documents {
 *         match /users/{uid} {
 *           allow read, write: if request.auth != null && request.auth.uid == uid;
 *         }
 *       }
 *     }
 *
 * Also add your GitHub Pages domain under Authentication -> Settings ->
 * Authorized domains, otherwise Google sign-in will be blocked.
 *
 * These keys are PUBLIC by design — Firebase security comes from the rules
 * above, not from hiding the config. If you leave them blank, the game runs in
 * local-browser-account mode and everything still works on this device.
 */
window.RedHerringConfig = {
  firebase: {
    apiKey: "AIzaSyDg0bk5hjiwah1HtfW4rdMowNzZy6bbM7s",
    authDomain: "red-herring-aa509.firebaseapp.com",
    projectId: "red-herring-aa509",
    appId: "1:251085884877:web:c57eaf380c3d7ab3350884"
  }
};
