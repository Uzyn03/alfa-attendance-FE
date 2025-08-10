// composables/useFirestore.js
import { ref, readonly } from "vue";

// Global state untuk Firebase
let firebaseApp = null;
const isInitialized = ref(false);
const isLoading = ref(false);
const error = ref(null);
const db = ref(null);

export const useFirestore = () => {
  // Inisialisasi Firebase (dipanggil dari plugin)
  const initializeFirebase = async (config) => {
    try {
      // Jika sudah diinisialisasi, skip
      if (firebaseApp && isInitialized.value && db.value) {
        console.log("Firebase sudah diinisialisasi sebelumnya");
        return db.value;
      }

      console.log("Menginisialisasi Firebase dengan config:", {
        projectId: config.projectId,
        authDomain: config.authDomain,
      });

      // Import Firebase modules
      const { initializeApp } = await import("firebase/app");
      const { getFirestore } = await import("firebase/firestore");

      // Inisialisasi Firebase app
      if (!firebaseApp) {
        firebaseApp = initializeApp(config);
        console.log("Firebase App berhasil diinisialisasi");
      }

      // Inisialisasi Firestore
      db.value = getFirestore(firebaseApp);
      isInitialized.value = true;
      error.value = null;

      console.log("Firestore berhasil diinisialisasi");
      return db.value;
    } catch (err) {
      console.error("Gagal menginisialisasi Firebase:", err);
      error.value = `Gagal menginisialisasi Firebase: ${err.message}`;
      isInitialized.value = false;
      db.value = null;
      throw err;
    }
  };

  // Pastikan Firebase sudah terinisialisasi
  const ensureInitialized = async () => {
    // Tunggu sampai inisialisasi selesai
    let attempts = 0;
    const maxAttempts = 50; // 10 detik maksimal

    while (!isInitialized.value && attempts < maxAttempts) {
      console.log(
        `Menunggu inisialisasi Firebase... (${attempts + 1}/${maxAttempts})`
      );
      await new Promise((resolve) => setTimeout(resolve, 200));
      attempts++;
    }

    if (!isInitialized.value || !db.value) {
      throw new Error("Firebase gagal diinisialisasi atau timeout");
    }

    console.log("Firebase siap digunakan");
    return db.value;
  };

  // Simpan prediksi ke Firestore
  const savePrediction = async (data) => {
    await ensureInitialized();

    isLoading.value = true;
    error.value = null;

    try {
      console.log("Menyimpan prediksi ke Firestore...");
      const { collection, addDoc } = await import("firebase/firestore");

      const docRef = await addDoc(collection(db.value, "predictions"), {
        ...data,
        createdAt: new Date(),
        timestamp: new Date().toISOString(), // Tambahan timestamp string
      });

      console.log("Prediksi berhasil disimpan dengan ID:", docRef.id);
      return docRef.id;
    } catch (err) {
      console.error("Gagal menyimpan prediksi:", err);
      error.value = `Gagal menyimpan prediksi: ${err.message}`;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Ambil prediksi dari Firestore
  const getPredictions = async (limit = 10) => {
    await ensureInitialized();

    isLoading.value = true;
    error.value = null;

    try {
      console.log(`Mengambil ${limit} prediksi dari Firestore...`);
      const {
        collection,
        query,
        orderBy,
        limit: firestoreLimit,
        getDocs,
      } = await import("firebase/firestore");

      const q = query(
        collection(db.value, "predictions"),
        orderBy("createdAt", "desc"),
        firestoreLimit(limit)
      );

      const querySnapshot = await getDocs(q);
      const predictions = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convert Firestore timestamp to JS Date if needed
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : data.createdAt,
        };
      });

      console.log(`Berhasil mengambil ${predictions.length} prediksi`);
      return predictions;
    } catch (err) {
      console.error("Gagal mengambil prediksi:", err);
      error.value = `Gagal mengambil prediksi: ${err.message}`;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Test koneksi Firebase
  const testConnection = async () => {
    try {
      await ensureInitialized();

      // Test dengan query sederhana
      const { collection, query, limit, getDocs } = await import(
        "firebase/firestore"
      );
      const q = query(collection(db.value, "predictions"), limit(1));
      const snapshot = await getDocs(q);

      console.log("Test koneksi berhasil, dokumen ditemukan:", snapshot.size);
      return { success: true, documentsCount: snapshot.size };
    } catch (err) {
      console.error("Test koneksi gagal:", err);
      throw err;
    }
  };

  // Simpan data karyawan
  const saveEmployee = async (employeeData) => {
    await ensureInitialized();

    isLoading.value = true;
    error.value = null;

    try {
      console.log("Menyimpan data karyawan...");
      const { collection, addDoc } = await import("firebase/firestore");

      const docRef = await addDoc(collection(db.value, "employees"), {
        ...employeeData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log("Data karyawan berhasil disimpan dengan ID:", docRef.id);
      return docRef.id;
    } catch (err) {
      console.error("Gagal menyimpan data karyawan:", err);
      error.value = `Gagal menyimpan karyawan: ${err.message}`;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Ambil data karyawan dari Firestore
  const getEmployees = async () => {
    await ensureInitialized();

    isLoading.value = true;
    error.value = null;

    try {
      console.log("Mengambil data karyawan...");
      const { collection, getDocs } = await import("firebase/firestore");

      const querySnapshot = await getDocs(collection(db.value, "employees"));
      const employees = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : data.createdAt,
          updatedAt: data.updatedAt?.toDate
            ? data.updatedAt.toDate()
            : data.updatedAt,
        };
      });

      console.log(`Berhasil mengambil ${employees.length} data karyawan`);
      return employees;
    } catch (err) {
      console.error("Gagal mengambil data karyawan:", err);
      error.value = `Gagal mengambil karyawan: ${err.message}`;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    // State
    isInitialized: readonly(isInitialized),
    isLoading: readonly(isLoading),
    error: readonly(error),
    db: readonly(db),

    // Methods
    initializeFirebase,
    ensureInitialized,
    testConnection,
    savePrediction,
    getPredictions,
    saveEmployee,
    getEmployees,
  };
};
