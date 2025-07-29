// firebaseConfig.js
// Substitua os valores deste objeto pelo seu configuration obtido no Console do Firebase.
// Certifique‑se de não compartilhar as chaves em um repositório público.

const firebaseConfig = {
  apiKey: "AIzaSyAhnenwFDrDITtuoKq_KWZYkhaoZy32O4A",
  authDomain: "escola-theo-2026.firebaseapp.com",
  projectId: "escola-theo-2026",
  // O valor abaixo é definido pelo console do Firebase. Verifique se está correto;
  // normalmente termina com `.appspot.com`. Ajuste se necessário.
  storageBucket: "escola-theo-2026.firebasestorage.app",
  messagingSenderId: "22017358398",
  appId: "1:22017358398:web:fc2f84bf47b083d901ef6f"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);

// Exporta instâncias para uso em outros scripts
const db = firebase.firestore();
const storage = firebase.storage();