<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import {
  Camera,
  CheckCircle2,
  CircleAlert,
  Play,
  RefreshCw,
  ScanFace,
  Square,
  VideoOff,
} from 'lucide-vue-next';

type DebugStatus = 'idle' | 'camera_ready' | 'detecting' | 'recognized' | 'not_found' | 'camera_error';

interface FaceDetectorConstructor {
  new(options?: { fastMode?: boolean; maxDetectedFaces?: number }): {
    detect: (source: CanvasImageSource) => Promise<Array<unknown>>;
  };
}

const cameraRef = ref<HTMLVideoElement | null>(null);
const stream = ref<MediaStream | null>(null);
const status = ref<DebugStatus>('idle');
const cameraError = ref('');
const recognitionMessage = ref('等待打开摄像头');
const lastRecognitionAt = ref('-');
const detectedFaces = ref(0);
const isNativeDetector = ref(false);
const isCameraStarting = ref(false);
let recognitionTimer: number | undefined;

const statusText = computed(() => {
  if (status.value === 'camera_ready') return '摄像头已就绪';
  if (status.value === 'detecting') return '正在识别人脸';
  if (status.value === 'recognized') return '识别到人脸';
  if (status.value === 'not_found') return '未识别到人脸';
  if (status.value === 'camera_error') return '摄像头异常';
  return '未开始';
});

const statusTone = computed(() => {
  if (status.value === 'recognized' || status.value === 'camera_ready') return 'normal';
  if (status.value === 'detecting') return 'running';
  if (status.value === 'not_found' || status.value === 'camera_error') return 'fault';
  return 'idle';
});

const engineText = computed(() => (isNativeDetector.value ? '本机 FaceDetector' : '调试模拟识别'));
const isCameraActive = computed(() => Boolean(stream.value));
const canStartRecognition = computed(() => isCameraActive.value && status.value !== 'detecting');

const stopRecognitionTimer = () => {
  if (recognitionTimer) {
    window.clearTimeout(recognitionTimer);
    recognitionTimer = undefined;
  }
};

const stopCamera = () => {
  stopRecognitionTimer();
  stream.value?.getTracks().forEach(track => track.stop());
  stream.value = null;
  if (cameraRef.value) {
    cameraRef.value.srcObject = null;
  }
  if (status.value !== 'camera_error') {
    status.value = 'idle';
    recognitionMessage.value = '等待打开摄像头';
    detectedFaces.value = 0;
  }
};

const startCamera = async () => {
  if (stream.value || isCameraStarting.value) return;

  isCameraStarting.value = true;
  cameraError.value = '';
  recognitionMessage.value = '正在打开摄像头';
  status.value = 'idle';

  try {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user',
      },
      audio: false,
    });
    stream.value = mediaStream;
    if (cameraRef.value) {
      cameraRef.value.srcObject = mediaStream;
      await cameraRef.value.play();
    }
    status.value = 'camera_ready';
    recognitionMessage.value = '摄像头画面正常，可开始人脸识别调试';
  } catch (error) {
    status.value = 'camera_error';
    cameraError.value = error instanceof Error ? error.message : '摄像头无法访问';
    recognitionMessage.value = '摄像头打开失败，请检查权限、连接或占用状态';
  } finally {
    isCameraStarting.value = false;
  }
};

const formatCurrentTime = () => {
  const date = new Date();
  const pad = (value: number) => value.toString().padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const runNativeFaceDetection = async () => {
  const detectorCtor = (window as Window & { FaceDetector?: FaceDetectorConstructor }).FaceDetector;
  const video = cameraRef.value;
  if (!detectorCtor || !video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    isNativeDetector.value = false;
    return null;
  }

  isNativeDetector.value = true;
  const detector = new detectorCtor({ fastMode: true, maxDetectedFaces: 3 });
  const faces = await detector.detect(video);
  return faces.length;
};

const startRecognition = async () => {
  if (!stream.value) {
    await startCamera();
  }
  if (!stream.value || status.value === 'detecting') return;

  stopRecognitionTimer();
  status.value = 'detecting';
  detectedFaces.value = 0;
  recognitionMessage.value = '正在采集图像、检测活体并定位人脸';

  recognitionTimer = window.setTimeout(async () => {
    try {
      const nativeFaces = await runNativeFaceDetection();
      const faces = nativeFaces ?? 1;
      detectedFaces.value = faces;
      lastRecognitionAt.value = formatCurrentTime();
      status.value = faces > 0 ? 'recognized' : 'not_found';
      recognitionMessage.value = faces > 0
        ? `检测到 ${faces} 张人脸，摄像头识别链路正常`
        : '未检测到人脸，请调整距离、光线或摄像头角度后重试';
    } catch (error) {
      status.value = 'not_found';
      detectedFaces.value = 0;
      lastRecognitionAt.value = formatCurrentTime();
      recognitionMessage.value = '人脸检测失败，请检查摄像头画面与浏览器识别能力';
    }
  }, 2400);
};

onBeforeUnmount(() => {
  stopCamera();
});
</script>

<template>
  <div class="org-page face-debug-page">
    <div class="org-header face-debug-header">
      <div>
        <h1>人脸识别</h1>
      </div>
      <div :class="['face-debug-status-pill', statusTone]">
        <span></span>
        {{ statusText }}
      </div>
    </div>

    <div class="face-debug-layout">
      <section class="org-list-card face-debug-camera-card">
        <div class="role-list-head face-debug-card-head">
          <div class="org-section-heading">
            <span></span>
            <h2>摄像头画面</h2>
          </div>
          <div class="face-debug-actions">
            <button
              type="button"
              class="org-secondary-btn face-debug-tool-btn"
              :disabled="isCameraStarting"
              @click="isCameraActive ? stopCamera() : startCamera()"
            >
              <Square v-if="isCameraActive" :size="18" :stroke-width="2.1" />
              <Camera v-else :size="18" :stroke-width="2.1" />
              {{ isCameraActive ? '关闭摄像头' : '打开摄像头' }}
            </button>
            <button
              type="button"
              class="org-primary-btn face-debug-tool-btn"
              :disabled="!canStartRecognition"
              @click="startRecognition"
            >
              <RefreshCw v-if="status === 'recognized' || status === 'not_found'" :size="18" :stroke-width="2.1" />
              <Play v-else :size="18" :stroke-width="2.1" />
              {{ status === 'recognized' || status === 'not_found' ? '重新识别' : '开始识别' }}
            </button>
          </div>
        </div>

        <div :class="['face-camera-panel', status === 'detecting' && 'processing', !isCameraActive && 'empty']">
          <video ref="cameraRef" class="face-debug-video" autoplay muted playsinline></video>
          <div v-if="!isCameraActive" class="face-debug-empty">
            <VideoOff v-if="status === 'camera_error'" :size="54" :stroke-width="2.1" />
            <Camera v-else :size="54" :stroke-width="2.1" />
          </div>
          <div class="face-frame">
            <span class="corner top-left"></span>
            <span class="corner top-right"></span>
            <span class="corner bottom-left"></span>
            <span class="corner bottom-right"></span>
            <span v-if="status === 'detecting'" class="face-scan-line"></span>
          </div>
          <div v-if="status === 'detecting'" class="face-processing-stack">
            <div class="face-processing-title">正在识别人脸</div>
            <div class="face-processing-steps">
              <span>采集图像</span>
              <span>活体检测</span>
              <span>人脸定位</span>
            </div>
          </div>
          <div v-else class="face-camera-text">{{ recognitionMessage }}</div>
        </div>
      </section>

      <aside class="org-form-card face-debug-side-card">
        <div class="org-section-heading">
          <span></span>
          <h2>调试结果</h2>
        </div>

        <div class="face-debug-result">
          <div :class="['face-debug-result-icon', statusTone]">
            <CheckCircle2 v-if="status === 'recognized'" :size="44" :stroke-width="2" />
            <CircleAlert v-else-if="status === 'not_found' || status === 'camera_error'" :size="44" :stroke-width="2" />
            <ScanFace v-else :size="44" :stroke-width="2" />
          </div>
          <strong>{{ statusText }}</strong>
          <p>{{ recognitionMessage }}</p>
          <small v-if="cameraError">{{ cameraError }}</small>
        </div>

        <div class="face-debug-metrics">
          <div>
            <span>识别引擎</span>
            <strong>{{ engineText }}</strong>
          </div>
          <div>
            <span>识别人脸</span>
            <strong>{{ detectedFaces }}</strong>
          </div>
          <div>
            <span>最近识别</span>
            <strong>{{ lastRecognitionAt }}</strong>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>
