/*
 * RED HERRING — public configuration.
 *
 * To enable real accounts (including Google sign-in) and cloud saves:
 *  1. Create a Firebase project at https://console.firebase.google.com
 *  2. Enable Authentication -> Sign-in method -> Email/Password AND Google.
 *  3. Create a Firestore database (production mode is fine).
 *  4. Add a Web app, then paste its config values below.
 *  5. Publish the Firestore rules from README.md. They must allow each player
 *     to read/write only their own /users/{uid} save, and allow the game to
 *     record code redemptions in /codeUses/{code}/claims/{claimId}. Example:
 *
 *     rules_version = '2';
 *     service cloud.firestore {
 *       match /databases/{database}/documents {
 *         match /users/{uid} {
 *           allow read, write: if request.auth != null && request.auth.uid == uid;
 *         }
 *         match /codeUses/{code} {
 *           allow read: if true;
 *           allow create, update: if
 *             request.resource.data.keys().hasOnly(['code', 'count', 'updated']) &&
 *             request.resource.data.code == code &&
 *             request.resource.data.count is int &&
 *             request.resource.data.count >= 0;
 *           allow delete: if false;
 *           match /claims/{claimId} {
 *             allow read: if true;
 *             allow create: if
 *               request.resource.data.keys().hasOnly(['id', 'code', 'owner', 'at']) &&
 *               request.resource.data.id == claimId &&
 *               request.resource.data.code == code &&
 *               claimId.matches('^[A-Za-z0-9_-]{3,80}$');
 *             allow update, delete: if false;
 *           }
 *         }
 *       }
 *     }
 *
 * Also add your GitHub Pages domain under Authentication -> Settings ->
 * Authorized domains, otherwise Google sign-in will be blocked.
 *
 * IMPORTANT: if Firestore rules are left at the default "deny all", logins
 * still work but progress will NOT sync between devices. The ACCOUNT panel
 * shows "SYNC FAILED" when that happens. Publish the rules shown above in
 * Firebase Console -> Firestore Database -> Rules, then reload.
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
