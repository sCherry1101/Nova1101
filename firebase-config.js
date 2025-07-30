const firebaseConfig = {
   apiKey: "AIzaSyD_HHhQZUPNkTO4NG35lwGvsKLVGSOHjWU",
  authDomain: "nova1101.firebaseapp.com",
  projectId: "nova1101",
  storageBucket: "nova1101.firebasestorage.app",
  messagingSenderId: "581000670800",
  appId: "1:581000670800:web:90373093f6b6a6cb3deb55",
  measurementId: "G-F4YL3HEMHD"
};

firebase.initializeApp(firebaseConfig);

window.auth = firebase.auth();
window.db = firebase.firestore();
window.rtdb = firebase.database();
