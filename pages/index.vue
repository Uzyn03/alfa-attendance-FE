<template>
  <div class="min-h-screen bg-background">
    <header
      class="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div class="container mx-auto px-4 py-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary"
            >
              <BarChart3 class="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 class="text-2xl font-bold text-foreground">
                Employee Analytics
              </h1>
              <p class="text-sm text-muted-foreground">
                Performance Prediction System
              </p>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <div
              class="flex items-center space-x-2 text-sm text-muted-foreground"
            >
              <div
                class="h-2 w-2 animate-pulse rounded-full"
                :class="
                  firebaseStatus.connected ? 'bg-green-500' : 'bg-red-500'
                "
              ></div>
              <span>{{
                firebaseStatus.connected
                  ? "Firebase Connected"
                  : "Firebase Disconnected"
              }}</span>
            </div>
            <Button
              @click="refreshData"
              :disabled="isRefreshing"
              variant="outline"
              size="sm"
            >
              <RefreshCw
                :class="{ 'animate-spin': isRefreshing }"
                class="mr-2 h-4 w-4"
              />
              Refresh
            </Button>
          </div>
        </div>
      </div>
    </header>

    <div class="container mx-auto space-y-8 py-8 px-4 md:px-6">
      <div class="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card
          class="border-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white"
        >
          <CardContent class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-blue-100">
                  Total Predictions
                </p>
                <p class="text-3xl font-bold">{{ stats.totalPredictions }}</p>
              </div>
              <TrendingUp class="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card
          class="border-0 bg-gradient-to-r from-green-500 to-green-600 text-white"
        >
          <CardContent class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-green-100">Model Accuracy</p>
                <p class="text-2xl font-bold">{{ stats.modelAccuracy }}%</p>
              </div>
              <Target class="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card
          class="border-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white"
        >
          <CardContent class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-purple-100">
                  Avg Performance
                </p>
                <p class="text-3xl font-bold">{{ stats.avgPerformance }}</p>
              </div>
              <Award class="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card
          class="border-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white"
        >
          <CardContent class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-orange-100">Last Updated</p>
                <ClientOnly>
                  <p class="text-lg font-bold">
                    {{ formatTime(stats.lastUpdated) }}
                  </p>
                  <template #fallback>
                    <p class="text-lg font-bold">Loading...</p>
                  </template>
                </ClientOnly>
              </div>
              <Database class="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card class="border shadow-lg">
        <CardHeader class="bg-primary text-primary-foreground">
          <CardTitle class="flex items-center space-x-2">
            <Brain class="h-6 w-6" />
            <span>Performance Prediction</span>
          </CardTitle>
          <CardDescription class="text-primary-foreground/80">
            Predict employee performance using Random Forest Regression model
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-6 p-8">
          <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="(config, key) in inputConfigs"
              :key="key"
              class="space-y-3"
            >
              <Label
                :for="key"
                class="flex items-center space-x-2 text-sm font-semibold"
              >
                <component :is="config.icon" class="h-4 w-4 text-primary" />
                <span>{{ config.label }}</span>
              </Label>
              <div class="relative">
                <Input
                  :id="key"
                  type="number"
                  step="0.1"
                  :min="config.min"
                  :max="config.max"
                  v-model="regressionFeatures[key]"
                  @input="handleFeatureChange"
                  class="pr-12"
                  :placeholder="`${config.min}-${config.max}`"
                />
                <span
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                >
                  {{ config.unit }}
                </span>
              </div>
              <div class="h-2 w-full rounded-full bg-secondary">
                <div
                  class="h-2 rounded-full bg-primary transition-all duration-300"
                  :style="{
                    width: `${Math.min(
                      (regressionFeatures[key] / config.max) * 100,
                      100
                    )}%`,
                  }"
                ></div>
              </div>
            </div>
          </div>

          <Separator />

          <div class="flex flex-col gap-4 sm:flex-row">
            <Button
              @click="handlePredictRegression"
              :disabled="loadingRegression"
              class="flex-1"
              size="lg"
            >
              <Brain v-if="!loadingRegression" class="mr-2 h-5 w-5" />
              <Loader2 v-else class="mr-2 h-5 w-5 animate-spin" />
              {{ loadingRegression ? "Analyzing..." : "Predict Performance" }}
            </Button>

            <Button
              @click="saveToFirestore"
              :disabled="
                !regressionPrediction ||
                savingToFirestore ||
                !firebaseStatus.connected
              "
              variant="outline"
              size="lg"
              class="flex-1 sm:flex-none"
            >
              <Database v-if="!savingToFirestore" class="mr-2 h-5 w-5" />
              <Loader2 v-else class="mr-2 h-5 w-5 animate-spin" />
              {{ savingToFirestore ? "Saving..." : "Save to Database" }}
            </Button>
          </div>

          <div
            v-if="errorRegression"
            class="rounded-lg border border-destructive/50 bg-destructive/10 p-4"
          >
            <div class="flex items-center">
              <AlertCircle class="mr-2 h-5 w-5 text-destructive" />
              <p class="font-medium text-destructive">{{ errorRegression }}</p>
            </div>
          </div>

          <div
            v-if="firebaseError"
            class="rounded-lg border border-destructive/50 bg-destructive/10 p-4"
          >
            <div class="flex items-center">
              <AlertCircle class="mr-2 h-5 w-5 text-destructive" />
              <p class="font-medium text-destructive">
                Firebase Error: {{ firebaseError }}
              </p>
            </div>
          </div>

          <div
            v-if="successMessage"
            class="rounded-lg border border-green-500/50 bg-green-50 p-4 dark:bg-green-950"
          >
            <div class="flex items-center">
              <CheckCircle class="mr-2 h-5 w-5 text-green-600" />
              <p class="font-medium text-green-700 dark:text-green-300">
                {{ successMessage }}
              </p>
            </div>
          </div>

          <div
            v-if="regressionPrediction"
            class="rounded-xl border-2 border-green-200 bg-green-50 p-6 transition-all duration-500 hover:shadow-lg dark:border-green-800 dark:bg-green-950"
          >
            <div class="space-y-4 text-center">
              <div class="flex items-center justify-center space-x-2">
                <CheckCircle class="h-8 w-8 text-green-600" />
                <h3
                  class="text-xl font-bold text-green-800 dark:text-green-200"
                >
                  Prediction Result
                </h3>
              </div>

              <Card class="bg-background shadow-lg">
                <CardContent class="p-6">
                  <div class="mb-4 flex items-center justify-center space-x-4">
                    <div class="text-center">
                      <p class="text-4xl font-bold">
                        {{ regressionPrediction.predicted_score.toFixed(1) }}
                      </p>
                      <p class="text-sm text-muted-foreground">
                        Performance Score
                      </p>
                    </div>
                    <Separator orientation="vertical" class="h-16" />
                    <div class="text-center">
                      <p
                        class="text-2xl font-bold"
                        :class="getCategoryColor(regressionPrediction.category)"
                      >
                        {{ regressionPrediction.category }}
                      </p>
                      <p class="text-sm text-muted-foreground">Category</p>
                    </div>
                  </div>

                  <div class="mb-4 h-4 w-full rounded-full bg-secondary">
                    <div
                      class="h-4 rounded-full transition-all duration-1000 ease-out"
                      :class="
                        getScoreBarColor(regressionPrediction.predicted_score)
                      "
                      :style="{
                        width: `${Math.min(
                          regressionPrediction.predicted_score,
                          100
                        )}%`,
                      }"
                    ></div>
                  </div>

                  <p
                    class="text-center font-medium text-green-700 dark:text-green-300"
                  >
                    {{ regressionPrediction.message }}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="border shadow-lg">
        <CardHeader
          class="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
        >
          <CardTitle class="flex items-center space-x-2">
            <Activity class="h-6 w-6" />
            <span>Model Analytics & Visualizations</span>
          </CardTitle>
          <CardDescription class="text-purple-100">
            Real-time model performance metrics and dynamic visualizations
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-6 p-8">
          <div class="flex flex-wrap gap-4">
            <Button
              @click="fetchModelStatus"
              :disabled="loadingModelStatus"
              class="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <BarChart3 v-if="!loadingModelStatus" class="mr-2 h-4 w-4" />
              <Loader2 v-else class="mr-2 h-4 w-4 animate-spin" />
              {{ loadingModelStatus ? "Loading..." : "Refresh Analytics" }}
            </Button>

            <Button
              @click="handleRetrainModel"
              :disabled="loadingModelStatus"
              variant="outline"
            >
              <RefreshCw v-if="!loadingModelStatus" class="mr-2 h-4 w-4" />
              <Loader2 v-else class="mr-2 h-4 w-4 animate-spin" />
              {{ loadingModelStatus ? "Training..." : "Retrain Model" }}
            </Button>

            <Button
              @click="testFirebaseConnection"
              :disabled="testingFirebase"
              variant="outline"
            >
              <Database v-if="!testingFirebase" class="mr-2 h-4 w-4" />
              <Loader2 v-else class="mr-2 h-4 w-4 animate-spin" />
              {{ testingFirebase ? "Testing..." : "Test Firebase" }}
            </Button>
          </div>

          <div
            v-if="errorModelStatus"
            class="rounded-lg border border-destructive/50 bg-destructive/10 p-4"
          >
            <div class="flex items-center">
              <AlertCircle class="mr-2 h-5 w-5 text-destructive" />
              <p class="font-medium text-destructive">{{ errorModelStatus }}</p>
            </div>
          </div>

          <div
            v-if="modelStatus && modelStatus.model_trained"
            class="space-y-8"
          >
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card
                class="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950"
              >
                <CardContent class="p-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <p
                        class="text-sm font-medium text-blue-600 dark:text-blue-400"
                      >
                        Training R²
                      </p>
                      <p
                        class="text-2xl font-bold text-blue-800 dark:text-blue-200"
                      >
                        {{
                          modelStatus.model_metadata?.rf_train_r2?.toFixed(3) ||
                          "N/A"
                        }}
                      </p>
                    </div>
                    <TrendingUp class="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card
                class="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
              >
                <CardContent class="p-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <p
                        class="text-sm font-medium text-green-600 dark:text-green-400"
                      >
                        Test R²
                      </p>
                      <p
                        class="text-2xl font-bold text-green-800 dark:text-green-200"
                      >
                        {{
                          modelStatus.model_metadata?.rf_test_r2?.toFixed(3) ||
                          "N/A"
                        }}
                      </p>
                    </div>
                    <Target class="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card
                class="border-pink-200 bg-pink-50 dark:border-pink-800 dark:bg-pink-950"
              >
                <CardContent class="p-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <p
                        class="text-sm font-medium text-pink-600 dark:text-pink-400"
                      >
                        Test MSE
                      </p>
                      <p
                        class="text-2xl font-bold text-pink-800 dark:text-pink-200"
                      >
                        {{
                          modelStatus.model_metadata?.rf_test_mse?.toFixed(3) ||
                          "N/A"
                        }}
                      </p>
                    </div>
                    <BarChart3 class="h-8 w-8 text-pink-500" />
                  </div>
                </CardContent>
              </Card>
              <Card
                class="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950"
              >
                <CardContent class="p-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <p
                        class="text-sm font-medium text-yellow-600 dark:text-yellow-400"
                      >
                        Test MAE
                      </p>
                      <p
                        class="text-2xl font-bold text-yellow-800 dark:text-yellow-200"
                      >
                        {{
                          modelStatus.model_metadata?.rf_test_mae?.toFixed(3) ||
                          "N/A"
                        }}
                      </p>
                    </div>
                    <TrendingUp class="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div class="space-y-6">
              <h3 class="flex items-center space-x-2 text-xl font-semibold">
                <BarChart3 class="h-6 w-6 text-primary" />
                <span>Dynamic Model Visualizations</span>
              </h3>

              <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <Card
                  v-if="modelStatus.feature_importance_plot"
                  class="overflow-hidden"
                >
                  <CardHeader
                    class="bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                  >
                    <CardTitle class="flex items-center space-x-2 text-base">
                      <BarChart3 class="h-5 w-5" />
                      <span>Feature Importance</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent class="p-4">
                    <img
                      :src="modelStatus.feature_importance_plot"
                      alt="Feature Importance Plot"
                      class="h-auto w-full rounded-lg transition-transform duration-300"
                      :key="visualizationKey"
                    />
                  </CardContent>
                </Card>

                <Card
                  v-if="modelStatus.actual_vs_predicted_plot"
                  class="overflow-hidden"
                >
                  <CardHeader
                    class="bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                  >
                    <CardTitle class="flex items-center space-x-2 text-base">
                      <Target class="h-5 w-5" />
                      <span>Actual vs Predicted</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent class="p-4">
                    <img
                      :src="modelStatus.actual_vs_predicted_plot"
                      alt="Actual vs Predicted Plot"
                      class="h-auto w-full rounded-lg transition-transform duration-300"
                      :key="visualizationKey"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <div
            v-else-if="!loadingModelStatus && !errorModelStatus"
            class="py-12 text-center"
          >
            <div class="space-y-4">
              <AlertCircle class="mx-auto h-16 w-16 text-muted-foreground" />
              <h3 class="text-xl font-semibold text-muted-foreground">
                No Model Data Available
              </h3>
              <p class="text-muted-foreground">
                Train the model first to see analytics and visualizations
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="border shadow-lg">
        <CardHeader
          class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
        >
          <CardTitle class="flex items-center space-x-2">
            <History class="h-6 w-6" />
            <span>Recent Predictions</span>
          </CardTitle>
          <CardDescription class="text-indigo-100">
            History of recent performance predictions
          </CardDescription>
        </CardHeader>
        <CardContent class="p-6">
          <div v-if="predictionHistory.length === 0" class="py-8 text-center">
            <History class="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p class="text-muted-foreground">
              No predictions yet. Make your first prediction above!
            </p>
          </div>
          <div v-else class="space-y-4">
            <div
              v-for="(prediction, index) in predictionHistory.slice(0, 5)"
              :key="index"
              class="rounded-lg border bg-card p-4 transition-shadow hover:shadow-md"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                  <div
                    class="flex h-12 w-12 items-center justify-center rounded-full font-bold text-white"
                    :class="getScoreBackgroundColor(prediction.score)"
                  >
                    {{ prediction.score.toFixed(0) }}
                  </div>
                  <div>
                    <p class="font-semibold">
                      Score: {{ prediction.score.toFixed(1) }}
                    </p>
                    <p class="text-sm text-muted-foreground">
                      Category: {{ prediction.category }}
                    </p>
                  </div>
                </div>
                <div class="text-right">
                  <ClientOnly>
                    <p class="text-sm text-muted-foreground">
                      {{ formatTime(prediction.timestamp) }}
                    </p>
                    <template #fallback>
                      <p class="text-sm text-muted-foreground">Loading...</p>
                    </template>
                  </ClientOnly>
                  <Button
                    @click="loadPrediction(prediction)"
                    size="sm"
                    variant="outline"
                    class="mt-2"
                  >
                    Load
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup>
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
import {
  BarChart3,
  Brain,
  TrendingUp,
  Target,
  Award,
  Clock,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertCircle,
  Activity,
  Database,
  History,
} from "lucide-vue-next";

// State
const regressionFeatures = ref({
  average_daily_hours: 8.0,
  attendance_rate: 95.0,
  overtime_ratio: 10.0,
  punctuality_score: 85.0,
  consistency_score: 80.0,
  productivity_score: 75.0,
});

const loadingRegression = ref(false);
const errorRegression = ref(null);
const regressionPrediction = ref(null);

const loadingModelStatus = ref(false);
const errorModelStatus = ref(null);
const modelStatus = ref(null);

const savingToFirestore = ref(false);
const isRefreshing = ref(false);
const visualizationKey = ref(0);
const testingFirebase = ref(false);

const predictionHistory = ref([]);
const firebaseError = ref(null);
const successMessage = ref(null);

// Firebase status
const firebaseStatus = ref({
  connected: false,
  initialized: false,
});

// Stats
const stats = ref({
  totalPredictions: 0,
  modelAccuracy: 0,
  avgPerformance: 0,
  lastUpdated: new Date(),
});

// Input configurations
const inputConfigs = {
  average_daily_hours: {
    min: 0,
    max: 12,
    label: "Jam Kerja Harian (jam/hari)",
    unit: "jam",
    icon: Clock,
  },
  attendance_rate: {
    min: 0,
    max: 100,
    label: "Tingkat Kehadiran",
    unit: "%",
    icon: CheckCircle,
  },
  overtime_ratio: {
    min: 0,
    max: 100,
    label: "Rasio Lembur",
    unit: "%",
    icon: TrendingUp,
  },
  punctuality_score: {
    min: 0,
    max: 100,
    label: "Skor Ketepatan Waktu",
    unit: "pts",
    icon: Target,
  },
  consistency_score: {
    min: 0,
    max: 100,
    label: "Skor Konsistensi",
    unit: "pts",
    icon: Activity,
  },
  productivity_score: {
    min: 0,
    max: 100,
    label: "Skor Produktivitas",
    unit: "pts",
    icon: Award,
  },
};

// Initialize Firebase status
const checkFirebaseStatus = async () => {
  try {
    console.log("🔍 Mengecek status Firebase...");
    const { useFirestore } = await import("~/composables/useFirestore");
    const { isInitialized, db, ensureInitialized } = useFirestore();

    // Tunggu sampai Firebase siap
    try {
      await ensureInitialized();
      firebaseStatus.value.initialized = isInitialized.value;
      firebaseStatus.value.connected = isInitialized.value && db.value !== null;

      console.log("✅ Status Firebase berhasil dicek:", {
        initialized: firebaseStatus.value.initialized,
        connected: firebaseStatus.value.connected,
      });
    } catch (initError) {
      console.warn("⚠️ Firebase belum siap:", initError.message);
      firebaseStatus.value.initialized = false;
      firebaseStatus.value.connected = false;
    }
  } catch (error) {
    console.error("❌ Error saat mengecek status Firebase:", error);
    firebaseStatus.value.connected = false;
    firebaseStatus.value.initialized = false;
  }
};

// Test Firebase connection
const testFirebaseConnection = async () => {
  testingFirebase.value = true;
  firebaseError.value = null;
  successMessage.value = null;

  try {
    console.log("🧪 Memulai test koneksi Firebase...");
    const { useFirestore } = await import("~/composables/useFirestore");
    const { testConnection, isInitialized, db } = useFirestore();

    // Test koneksi menggunakan method khusus
    const result = await testConnection();

    console.log("✅ Test Firebase berhasil:", result);
    successMessage.value = `Koneksi Firebase berhasil! Ditemukan ${result.documentsCount} dokumen.`;
    firebaseStatus.value.connected = true;
    firebaseStatus.value.initialized = true;

    // Hapus pesan sukses setelah 4 detik
    setTimeout(() => {
      successMessage.value = null;
    }, 4000);
  } catch (error) {
    console.error("❌ Test Firebase gagal:", error);
    firebaseError.value = `Test Firebase gagal: ${error.message}`;
    firebaseStatus.value.connected = false;

    // Hapus pesan error setelah 8 detik
    setTimeout(() => {
      firebaseError.value = null;
    }, 8000);
  } finally {
    testingFirebase.value = false;
  }
};

// Methods
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
      throw new Error(errorData.detail || "Failed to make prediction");
    }

    const data = await response.json();
    regressionPrediction.value = data;

    // Add to history
    predictionHistory.value.unshift({
      score: data.predicted_score,
      category: data.category,
      timestamp: new Date(),
      features: { ...regressionFeatures.value },
    });

    // Update stats
    stats.value.totalPredictions++;
    stats.value.avgPerformance =
      predictionHistory.value.reduce((sum, p) => sum + p.score, 0) /
      predictionHistory.value.length;
    stats.value.lastUpdated = new Date();
    // 🔄 Tambahan: Update model status biar accuracy ikut update
    await fetchModelStatus();
  } catch (err) {
    errorRegression.value =
      err.message || "An unexpected error occurred during prediction.";
    console.error("Regression prediction error:", err);
  } finally {
    loadingRegression.value = false;
  }
};

const handleFeatureChange = (e) => {
  const target = e.target;
  const { id, value } = target;
  regressionFeatures.value = {
    ...regressionFeatures.value,
    [id]: Number.parseFloat(value) || 0,
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
      throw new Error(errorData.detail || "Failed to fetch model status");
    }

    const data = await response.json();
    modelStatus.value = data;

    // Update visualization key to force re-render
    visualizationKey.value = Date.now();

    // Update model accuracy stat
    if (data.model_metadata?.rf_test_r2) {
      stats.value.modelAccuracy = Math.round(
        data.model_metadata.rf_test_r2 * 100
      );
    }
  } catch (err) {
    errorModelStatus.value =
      err.message || "An error occurred while fetching model status.";
    console.error("Model status error:", err);
  } finally {
    loadingModelStatus.value = false;
  }
};

const handleRetrainModel = async () => {
  loadingModelStatus.value = true;
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
      throw new Error(errorData.detail || "Failed to retrain model");
    }

    successMessage.value =
      "Model successfully retrained! Loading latest model status...";
    await fetchModelStatus();

    // Clear success message after 3 seconds
    setTimeout(() => {
      successMessage.value = null;
    }, 3000);
  } catch (err) {
    errorModelStatus.value =
      err.message || "An error occurred while retraining the model.";
    console.error("Retrain model error:", err);
  } finally {
    loadingModelStatus.value = false;
  }
};

// Simpan ke Firestore
const saveToFirestore = async () => {
  if (!regressionPrediction.value) {
    firebaseError.value =
      "Tidak ada prediksi untuk disimpan. Buat prediksi terlebih dahulu.";
    setTimeout(() => {
      firebaseError.value = null;
    }, 3000);
    return;
  }

  savingToFirestore.value = true;
  firebaseError.value = null;
  successMessage.value = null;

  try {
    console.log("💾 Menyimpan prediksi ke Firestore...");
    const { useFirestore } = await import("~/composables/useFirestore");
    const { savePrediction } = useFirestore();

    // Siapkan data untuk disimpan
    const dataToSave = {
      features: { ...regressionFeatures.value },
      prediction: { ...regressionPrediction.value },
      timestamp: new Date(),
      metadata: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        savedAt: new Date().toISOString(),
      },
    };

    console.log("📦 Data yang akan disimpan:", dataToSave);

    // Simpan ke Firestore
    const docId = await savePrediction(dataToSave);

    console.log("✅ Prediksi berhasil disimpan dengan ID:", docId);
    successMessage.value = `Prediksi berhasil disimpan ke database! (ID: ${docId.substring(
      0,
      8
    )}...)`;

    // Update status Firebase
    firebaseStatus.value.connected = true;
    firebaseStatus.value.initialized = true;

    // Update stats
    stats.value.totalPredictions++;
    stats.value.lastUpdated = new Date();

    // Hapus pesan sukses setelah 4 detik
    setTimeout(() => {
      successMessage.value = null;
    }, 4000);
  } catch (error) {
    console.error("❌ Error saat menyimpan ke Firestore:", error);
    firebaseError.value = `Gagal menyimpan ke database: ${error.message}`;

    // Hapus pesan error setelah 8 detik
    setTimeout(() => {
      firebaseError.value = null;
    }, 8000);
  } finally {
    savingToFirestore.value = false;
  }
};

// Refresh semua data
const refreshData = async () => {
  isRefreshing.value = true;

  try {
    console.log("🔄 Refresh semua data...");

    // Jalankan semua refresh secara paralel
    await Promise.all([
      fetchModelStatus().catch((err) =>
        console.warn("Warning fetch model status:", err)
      ),
      checkFirebaseStatus().catch((err) =>
        console.warn("Warning check Firebase:", err)
      ),
      loadPredictionsFromFirestore().catch((err) =>
        console.warn("Warning load predictions:", err)
      ),
    ]);

    console.log("✅ Refresh data selesai");
  } catch (error) {
    console.error("❌ Error during refresh:", error);
  } finally {
    isRefreshing.value = false;
  }
};

// Load prediksi dari Firestore
const loadPredictionsFromFirestore = async () => {
  try {
    console.log("📥 Memuat prediksi dari Firestore...");
    const { useFirestore } = await import("~/composables/useFirestore");
    const { getPredictions } = useFirestore();

    const predictions = await getPredictions(10);

    // Convert ke format yang dibutuhkan komponen
    const formattedPredictions = predictions.map((pred) => ({
      score: pred.prediction?.predicted_score || 0,
      category: pred.prediction?.category || "Unknown",
      timestamp: pred.createdAt || new Date(),
      features: pred.features || {},
      id: pred.id,
    }));

    predictionHistory.value = formattedPredictions;

    console.log(
      `✅ Berhasil memuat ${predictions.length} prediksi dari Firestore`
    );

    // Update stats
    if (formattedPredictions.length > 0) {
      stats.value.totalPredictions = formattedPredictions.length;
      stats.value.avgPerformance =
        formattedPredictions.reduce((sum, p) => sum + p.score, 0) /
        formattedPredictions.length;
    }
  } catch (error) {
    console.error("⚠️ Gagal memuat prediksi dari Firestore:", error);
    // Tidak perlu show error ke user, cukup log saja
  }
};

// Utility functions
const getCategoryColor = (category) => {
  switch (category.toLowerCase()) {
    case "baik":
      return "text-green-600 dark:text-green-400";
    case "cukup":
      return "text-yellow-600 dark:text-yellow-400";
    case "kurang":
      return "text-red-600 dark:text-red-400";
    default:
      return "text-muted-foreground";
  }
};

const getScoreBarColor = (score) => {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  return "bg-red-500";
};

const getScoreBackgroundColor = (score) => {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  return "bg-red-500";
};

const getOverfittingStatus = (ratio) => {
  if (!ratio) return "Unknown";
  return ratio < 2.0 ? "Healthy" : "Warning";
};

const formatTime = (date) => {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  }).format(date);
};

// Initialize
onMounted(async () => {
  console.log("🚀 Komponen Vue dimount, memulai inisialisasi...");

  try {
    // Tunggu sebentar untuk memastikan plugin Firebase selesai
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Jalankan inisialisasi
    console.log("⏳ Menjalankan inisialisasi data...");
    await refreshData();

    console.log("✅ Inisialisasi komponen selesai");
  } catch (error) {
    console.error("❌ Error during component initialization:", error);
  }
});
</script>
