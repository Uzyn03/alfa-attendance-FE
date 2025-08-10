// plugins/firebase.client.js
import { defineNuxtPlugin } from "#app";
import { useRuntimeConfig } from "#app";
import { useFirestore } from "~/composables/useFirestore";

export default defineNuxtPlugin(async (nuxtApp) => {
  // Hanya jalan di client side
  if (process.server) return;

  console.log("🔥 Memulai inisialisasi Firebase plugin...");

  try {
    const { initializeFirebase } = useFirestore();
    const config = useRuntimeConfig();

    // Konfigurasi Firebase dari environment variables
    const firebaseConfig = {
      apiKey:
        config.public.firebaseApiKey ||
        "AIzaSyAUktxmFGbuNzclE8jZRJLjn5p5JEE95VE",
      authDomain:
        config.public.firebaseAuthDomain || "program-haji.firebaseapp.com",
      projectId: config.public.firebaseProjectId || "program-haji",
      storageBucket:
        config.public.firebaseStorageBucket ||
        "program-haji.firebasestorage.app",
      messagingSenderId:
        config.public.firebaseMessagingSenderId || "962632822707",
      appId:
        config.public.firebaseAppId ||
        "1:962632822707:web:5a59365ba091e3588b25c6",
    };

    console.log("🔧 Firebase config loaded:", {
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain,
      hasApiKey: !!firebaseConfig.apiKey,
    });

    // Inisialisasi Firebase
    await initializeFirebase(firebaseConfig);
    console.log("✅ Firebase berhasil diinisialisasi di plugin");

    // Tambahkan Firebase ke Nuxt app context (opsional)
    nuxtApp.provide("firebase", {
      initialized: true,
      config: firebaseConfig,
    });
  } catch (error) {
    console.error("❌ Gagal menginisialisasi Firebase di plugin:", error);

    // Provide error state ke Nuxt app
    nuxtApp.provide("firebase", {
      initialized: false,
      error: error.message,
    });
  }
});
