<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { CreditCard, ScanFace, User, LockKeyhole, Camera, X, CircleX } from 'lucide-vue-next';
import { messages, normalizeSupportedLocale } from '../i18n';
import type { LanguageCode } from '../i18n';

interface Props {
  open: boolean;
  initialMode?: LoginMode;
  language?: LanguageCode;
}

type LoginMode = 'account' | 'face' | 'card';

const props = withDefaults(defineProps<Props>(), {
  initialMode: 'account',
  language: 'zh-CN',
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'login'): void;
}>();

const loginMode = ref<LoginMode>('account');
const loginResult = ref<{ method: LoginMode } | null>(null);
const accountName = ref('管理员');
const accountPassword = ref('123456');
const faceProcessing = ref(false);
let faceTimer: ReturnType<typeof setTimeout> | null = null;

const locale = computed(() => normalizeSupportedLocale(props.language));
const t = computed(() => messages[locale.value].login);
const loginMethodLabels = computed<Record<LoginMode, string>>(() => ({
  account: t.value.accountMethod,
  face: t.value.faceMethod,
  card: t.value.cardMethod,
}));

const showLoginFailure = (method: LoginMode) => {
  loginResult.value = { method };
};

const resetLoginResult = () => {
  loginResult.value = null;
};

const switchLoginMode = (mode: LoginMode) => {
  loginMode.value = mode;
  faceProcessing.value = false;
  if (faceTimer) {
    clearTimeout(faceTimer);
    faceTimer = null;
  }
  resetLoginResult();
};

const handleAccountLogin = () => {
  if (['管理员', 'Admin'].includes(accountName.value.trim()) && accountPassword.value === '123456') {
    emit('login');
    return;
  }
  showLoginFailure('account');
};

const startFaceRecognition = () => {
  if (faceProcessing.value) return;
  faceProcessing.value = true;
  if (faceTimer) {
    clearTimeout(faceTimer);
  }
  faceTimer = setTimeout(() => {
    faceProcessing.value = false;
    emit('login');
    faceTimer = null;
  }, 1800);
};

watch(
  () => props.open,
  (open) => {
    if (open) {
      loginMode.value = props.initialMode;
      accountName.value = t.value.accountName;
      accountPassword.value = '123456';
      faceProcessing.value = false;
      if (faceTimer) {
        clearTimeout(faceTimer);
        faceTimer = null;
      }
      resetLoginResult();
    }
  }
);
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="open" class="login-modal-layer">
        <div class="login-modal-backdrop" @click="emit('close')" />

        <Transition
          appear
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-4"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-4"
        >
          <section class="login-modal-card" role="dialog" aria-modal="true" aria-labelledby="login-title">
            <header class="login-modal-header">
              <div class="login-heading">
                <div class="login-title-mark" />
                <div>
                  <h2 id="login-title">{{ t.title }}</h2>
                </div>
              </div>
              <button v-if="loginMode !== 'account'" type="button" class="login-close-button" @click="emit('close')">
                <X :size="34" :stroke-width="2" />
              </button>
            </header>

            <div class="login-modal-body">
              <div v-if="loginResult" class="login-result-panel">
                <div class="login-result-icon failure">
                  <CircleX :size="82" :stroke-width="1.9" />
                </div>
                <div class="login-result-title">
                  {{ loginMethodLabels[loginResult.method] }}{{ t.failureSuffix }}
                </div>
                <div class="login-result-message">
                  {{ t.failureMessage }}
                </div>
                <div class="login-result-actions">
                  <button type="button" class="login-result-secondary" @click="resetLoginResult">{{ t.retry }}</button>
                </div>
              </div>

              <div v-else-if="loginMode === 'account'">
                <label class="login-field">
                  <span>{{ t.accountLabel }} <strong>*</strong></span>
                  <div class="login-input-box">
                    <User :size="24" :stroke-width="2.3" />
                    <input v-model="accountName" type="text" :aria-label="t.accountLabel" />
                  </div>
                </label>

                <label class="login-field">
                  <span>{{ t.passwordLabel }} <strong>*</strong></span>
                  <div class="login-input-box">
                    <LockKeyhole :size="24" :stroke-width="2.3" />
                    <input v-model="accountPassword" type="password" :aria-label="t.passwordLabel" />
                  </div>
                </label>

                <button type="button" class="login-confirm" @click="handleAccountLogin">{{ t.confirm }}</button>
                <button type="button" class="login-failure-link" @click="showLoginFailure('account')">
                  {{ t.accountFailureAction }}
                </button>

                <div class="login-alt-divider">
                  <span></span>
                  <strong>{{ t.otherMethods }}</strong>
                  <span></span>
                </div>

                <div class="login-alt-row">
                  <button type="button" class="login-alt-link" @click="switchLoginMode('card')">
                    <CreditCard :size="32" :stroke-width="2.2" />
                    <span>{{ t.cardMethod }}</span>
                  </button>
                  <button type="button" class="login-alt-link" @click="switchLoginMode('face')">
                    <ScanFace :size="32" :stroke-width="2.2" />
                    <span>{{ t.faceMethod }}</span>
                  </button>
                </div>
              </div>

              <div v-else-if="loginMode === 'face'" class="face-login-body">
                <div :class="['face-camera-panel', faceProcessing && 'processing']" @click="startFaceRecognition">
                  <Camera :size="48" :stroke-width="2.4" class="face-camera-icon" />
                  <div class="face-frame">
                    <span class="corner top-left"></span>
                    <span class="corner top-right"></span>
                    <span class="corner bottom-left"></span>
                    <span class="corner bottom-right"></span>
                    <span v-if="faceProcessing" class="face-scan-line"></span>
                  </div>
                  <div v-if="faceProcessing" class="face-processing-stack">
                    <div class="face-processing-title">{{ t.faceProcessingTitle }}</div>
                    <div class="face-processing-steps">
                      <span>{{ t.faceStepCapture }}</span>
                      <span>{{ t.faceStepLiveness }}</span>
                      <span>{{ t.faceStepCompare }}</span>
                    </div>
                  </div>
                  <div v-else class="face-camera-text">{{ t.facePrompt }}</div>
                </div>

                <div class="login-alt-divider face-alt-divider">
                  <span></span>
                  <strong>{{ t.otherMethods }}</strong>
                  <span></span>
                </div>

                <div class="login-alt-row">
                  <button type="button" class="login-alt-link" @click="switchLoginMode('account')">
                    <User :size="32" :stroke-width="2.2" />
                    <span>{{ t.accountMethod }}</span>
                  </button>
                  <button type="button" class="login-alt-link" @click="switchLoginMode('card')">
                    <CreditCard :size="32" :stroke-width="2.2" />
                    <span>{{ t.cardMethod }}</span>
                  </button>
                </div>
              </div>

              <div v-else class="face-login-body">
                <div class="card-reader-panel" @click="emit('login')">
                  <div class="card-reader-icon">
                    <CreditCard :size="32" :stroke-width="2.2" />
                  </div>
                  <div class="card-reader-title">{{ t.cardTitle }}</div>
                  <div class="card-reader-subtitle">{{ t.cardSubtitle }}</div>
                </div>

                <div class="login-alt-divider face-alt-divider">
                  <span></span>
                  <strong>{{ t.otherMethods }}</strong>
                  <span></span>
                </div>

                <div class="login-alt-row">
                  <button type="button" class="login-alt-link" @click="switchLoginMode('account')">
                    <User :size="32" :stroke-width="2.2" />
                    <span>{{ t.accountMethod }}</span>
                  </button>
                  <button type="button" class="login-alt-link" @click="switchLoginMode('face')">
                    <ScanFace :size="32" :stroke-width="2.2" />
                    <span>{{ t.faceMethod }}</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
