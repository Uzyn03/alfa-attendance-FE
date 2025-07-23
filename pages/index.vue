<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";

// Interface untuk respons prediksi regresi
interface RegressionPrediction {
  predicted_score: number;
  category: string;
  message: string;
}

// Interface untuk status model regresi (termasuk plot Base64)
interface RegressionModelStatus {
  model_trained: boolean;
  feature_names: string[];
  model_metadata: { [key: string]: any }; // Menggunakan 'any' untuk fleksibilitas metadata
  feature_importance_plot?: string;
  actual_vs_predicted_plot?: string;
  predicted_distribution_plot?: string;
}

// State untuk Random Forest Regression
const regressionFeatures = ref({
  average_daily_hours: 0,
  attendance_rate: 0,
  overtime_ratio: 0,
  punctuality_score: 0,
  consistency_score: 0,
  productivity_score: 0,
});
const loadingRegression = ref<boolean>(false);
const errorRegression = ref<string | null>(null);
const regressionPrediction = ref<RegressionPrediction | null>(null);

// State untuk Status Model dan Visualisasi
const loadingModelStatus = ref<boolean>(false);
const errorModelStatus = ref<string | null>(null);
const modelStatus = ref<RegressionModelStatus | null>(null);

// Definisi rentang input untuk panduan
const inputRanges: {
  [key: string]: { min: number; max: number; label: string };
} = {
  average_daily_hours: {
    min: 0,
    max: 24,
    label: "Rata-rata jam kerja harian (0-24 jam)",
  },
  attendance_rate: { min: 0, max: 100, label: "Tingkat kehadiran (0-100%)" },
  overtime_ratio: { min: 0, max: 100, label: "Rasio jam lembur (0-100%)" },
  punctuality_score: {
    min: 0,
    max: 100,
    label: "Skor ketepatan waktu (0-100)",
  },
  consistency_score: { min: 0, max: 100, label: "Skor konsistensi (0-100)" },
  productivity_score: { min: 0, max: 100, label: "Skor produktivitas (0-100)" },
};

const handlePredictRegression = async () => {
  loadingRegression.value = true;
  errorRegression.value = null;
  regressionPrediction.value = null;

  try {
    const response = await fetch(
      "http://localhost:8000/api/v1/ml/regression/predict",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(regressionFeatures.value),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Gagal melakukan prediksi regresi");
    }

    const data: RegressionPrediction = await response.json();
    regressionPrediction.value = data;
  } catch (err: any) {
    errorRegression.value =
      err.message || "Terjadi kesalahan tak terduga saat prediksi regresi.";
    console.error("Regression prediction error:", err);
  } finally {
    loadingRegression.value = false;
  }
};

const handleFeatureChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const { id, value } = target;
  regressionFeatures.value = {
    ...regressionFeatures.value,
    [id]: Number.parseFloat(value),
  };
};

const fetchModelStatus = async () => {
  loadingModelStatus.value = true;
  errorModelStatus.value = null;
  modelStatus.value = null;

  try {
    const response = await fetch(
      "http://localhost:8000/api/v1/ml/regression/model-status"
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Gagal mengambil status model");
    }
    const data: RegressionModelStatus = await response.json();
    modelStatus.value = data;
  } catch (err: any) {
    errorModelStatus.value =
      err.message || "Terjadi kesalahan saat mengambil status model.";
    console.error("Model status error:", err);
  } finally {
    loadingModelStatus.value = false;
  }
};

const handleRetrainModel = async () => {
  loadingModelStatus.value = true; // Gunakan loading yang sama atau buat terpisah
  errorModelStatus.value = null;

  try {
    const response = await fetch(
      "http://localhost:8000/api/v1/ml/regression/train",
      {
        method: "POST",
      }
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Gagal melatih ulang model");
    }
    alert("Model berhasil dilatih ulang! Memuat status model terbaru...");
    await fetchModelStatus(); // Muat status model dan visualisasi terbaru
  } catch (err: any) {
    errorModelStatus.value =
      err.message || "Terjadi kesalahan saat melatih ulang model.";
    console.error("Retrain model error:", err);
  } finally {
    loadingModelStatus.value = false;
  }
};

// Fetch model status on component mount
onMounted(() => {
  fetchModelStatus();
});
</script>

<template>
  <div class="container mx-auto py-8 px-4 md:px-6">
    <h1 class="text-3xl font-bold text-center mb-8">
      Analisis Model Pembelajaran Mesin
    </h1>

    <!-- Bagian Random Forest Regression -->
    <Card class="w-full max-w-4xl mx-auto mb-8">
      <CardHeader>
        <CardTitle>Prediksi Random Forest Regression</CardTitle>
        <CardDescription>
          Prediksi skor kinerja karyawan berdasarkan metrik yang diberikan
          menggunakan model Random Forest Regression.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            class="space-y-2"
            v-for="(value, key) in regressionFeatures"
            :key="key"
          >
            <Label :for="key">
              {{
                inputRanges[key as keyof typeof inputRanges]?.label ||
                key.replace(/_/g, " ")
              }}
            </Label>
            <Input
              :id="key"
              type="number"
              step="0.1"
              :min="inputRanges[key as keyof typeof inputRanges]?.min"
              :max="inputRanges[key as keyof typeof inputRanges]?.max"
              v-model="regressionFeatures[key as keyof typeof regressionFeatures]"
              @input="handleFeatureChange"
            />
          </div>
        </div>
        <Button
          @click="handlePredictRegression"
          :disabled="loadingRegression"
          class="w-full"
        >
          {{
            loadingRegression
              ? "Melakukan Prediksi..."
              : "Prediksi Skor Kinerja"
          }}
        </Button>

        <p v-if="errorRegression" class="text-red-500 text-center">
          {{ errorRegression }}
        </p>

        <div
          v-if="regressionPrediction"
          class="mt-6 p-4 bg-green-100 text-green-800 rounded-md text-center"
        >
          <h3 class="text-lg font-semibold">Hasil Prediksi:</h3>
          <p class="text-2xl font-bold">
            {{ regressionPrediction.predicted_score.toFixed(2) }} ({{
              regressionPrediction.category
            }})
          </p>
          <p class="text-sm text-green-700">
            {{ regressionPrediction.message }}
          </p>
        </div>
      </CardContent>
    </Card>

    <!-- Bagian Status Model dan Visualisasi -->
    <Card class="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Status Model Regresi & Visualisasi</CardTitle>
        <CardDescription>
          Lihat detail model Random Forest Regression yang sedang digunakan dan
          visualisasi pelatihannya.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <Button
          @click="fetchModelStatus"
          :disabled="loadingModelStatus"
          class="w-full mb-4"
        >
          {{
            loadingModelStatus
              ? "Memuat Status..."
              : "Muat Status Model & Visualisasi"
          }}
        </Button>
        <Button
          @click="handleRetrainModel"
          :disabled="loadingModelStatus"
          class="w-full mb-4 bg-blue-500 hover:bg-blue-600 text-white"
        >
          {{ loadingModelStatus ? "Melatih Ulang..." : "Latih Ulang Model" }}
        </Button>

        <p v-if="errorModelStatus" class="text-red-500 text-center">
          {{ errorModelStatus }}
        </p>

        <div v-if="modelStatus && modelStatus.model_trained" class="space-y-6">
          <Separator />
          <h3 class="text-lg font-semibold">Detail Model</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p>
                <strong>Model Dilatih:</strong>
                {{ modelStatus.model_trained ? "Ya" : "Tidak" }}
              </p>
              <p>
                <strong>Terakhir Dilatih:</strong>
                {{
                  modelStatus.model_metadata?.rf_last_trained
                    ? new Date(
                        modelStatus.model_metadata.rf_last_trained
                      ).toLocaleString()
                    : "N/A"
                }}
              </p>
              <p>
                <strong>Ukuran Data Pelatihan:</strong>
                {{ modelStatus.model_metadata?.rf_training_data_size || "N/A" }}
              </p>
            </div>
            <div>
              <p>
                <strong>Train R²:</strong>
                {{
                  modelStatus.model_metadata?.rf_train_r2?.toFixed(4) || "N/A"
                }}
              </p>
              <p>
                <strong>Test R²:</strong>
                {{
                  modelStatus.model_metadata?.rf_test_r2?.toFixed(4) || "N/A"
                }}
              </p>
              <p>
                <strong>Train MSE:</strong>
                {{
                  modelStatus.model_metadata?.rf_train_mse?.toFixed(4) || "N/A"
                }}
              </p>
              <p>
                <strong>Test MSE:</strong>
                {{
                  modelStatus.model_metadata?.rf_test_mse?.toFixed(4) || "N/A"
                }}
              </p>
              <p>
                <strong>Overfitting Check:</strong>
                {{
                  modelStatus.model_metadata?.rf_overfitting_ratio
                    ? modelStatus.model_metadata.rf_overfitting_ratio < 2.0
                      ? "OK"
                      : "WARNING"
                    : "N/A"
                }}
              </p>
            </div>
          </div>

          <Separator />
          <h3 class="text-lg font-semibold">Visualisasi Model</h3>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div
              v-if="modelStatus.feature_importance_plot"
              class="flex flex-col items-center"
            >
              <h4 class="font-medium mb-2">Feature Importance</h4>
              <img
                :src="modelStatus.feature_importance_plot"
                alt="Feature Importance Plot"
                class="w-full h-auto rounded-md border"
              />
            </div>
            <div
              v-if="modelStatus.actual_vs_predicted_plot"
              class="flex flex-col items-center"
            >
              <h4 class="font-medium mb-2">Actual vs. Predicted Scores</h4>
              <img
                :src="modelStatus.actual_vs_predicted_plot"
                alt="Actual vs Predicted Plot"
                class="w-full h-auto rounded-md border"
              />
            </div>
            <div
              v-if="modelStatus.predicted_distribution_plot"
              class="flex flex-col items-center lg:col-span-2"
            >
              <h4 class="font-medium mb-2">Predicted Score Distribution</h4>
              <img
                :src="modelStatus.predicted_distribution_plot"
                alt="Predicted Score Distribution Plot"
                class="w-full h-auto rounded-md border"
              />
            </div>
            <p v-else class="text-center text-muted-foreground lg:col-span-2">
              Tidak ada visualisasi yang tersedia. Pastikan model telah dilatih.
            </p>
          </div>
        </div>
        <div
          v-else-if="!loadingModelStatus && !errorModelStatus"
          class="text-center text-muted-foreground"
        >
          Model belum dilatih atau tidak ada data status. Klik "Muat Status
          Model & Visualisasi" untuk memeriksa.
        </div>
      </CardContent>
    </Card>
  </div>
</template>
