// firebase.js
// This module initializes Firebase using the compat SDK and exports utilities for Auth and Firestore.
// It is loaded as a <script type="module"> in index.html.

import { firebaseConfig } from "./firebaseConfig.js";

// Import the compat libraries from the CDN.
import "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js";
import "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js";
import "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js";

// Initialize the Firebase app.
const app = firebase.initializeApp(firebaseConfig);

// Initialize Auth and Firestore services.
const auth = firebase.auth();
const db = firebase.firestore();

// Export for use in other modules.
export { app, auth, db };
