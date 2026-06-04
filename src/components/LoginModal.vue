<script setup lang="ts">
import { ref, watch } from 'vue';
import { CreditCard, ScanFace, User, LockKeyhole, Camera, X, CircleX } from 'lucide-vue-next';

interface Props {
  open: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'login'): void;
}>();

type LoginMode = 'account' | 'face' | 'card';

const loginMode = ref<LoginMode>('account');
const loginResult = ref<{ method: LoginMode } | null>(null);
const accountName = ref('管理员');
const accountPassword = ref('123456');
const faceProcessing = ref(false);
let faceTimer: ReturnType<typeof setTimeout> | null = null;

const loginMethodLabels: Record<LoginMode, string> = {
  account: '账号密码登录',
  face: '刷脸登录',
  card: '刷卡登录',
};

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
  if (accountName.value.trim() === '管理员' && accountPassword.value === '123456') {
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
      loginMode.value = 'account';
      accountName.value = '管理员';
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
                  <h2 id="login-title">身份验证</h2>
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
                  {{ loginMethodLabels[loginResult.method] }}失败
                </div>
                <div class="login-result-message">
                  身份验证未通过，请重新验证或切换其他登录方式
                </div>
                <div class="login-result-actions">
                  <button type="button" class="login-result-secondary" @click="resetLoginResult">重新验证</button>
                </div>
              </div>

              <div v-else-if="loginMode === 'account'">
                <label class="login-field">
                  <span>账号 <strong>*</strong></span>
                  <div class="login-input-box">
                    <User :size="24" :stroke-width="2.3" />
                    <input v-model="accountName" type="text" aria-label="账号" />
                  </div>
                </label>

                <label class="login-field">
                  <span>密码 <strong>*</strong></span>
                  <div class="login-input-box">
                    <LockKeyhole :size="24" :stroke-width="2.3" />
                    <input v-model="accountPassword" type="password" aria-label="密码" />
                  </div>
                </label>

                <button type="button" class="login-confirm" @click="handleAccountLogin">登录</button>
                <button type="button" class="login-failure-link" @click="showLoginFailure('account')">
                  模拟账号验证失败
                </button>

                <div class="login-alt-divider">
                  <span></span>
                  <strong>其他登录</strong>
                  <span></span>
                </div>

                <div class="login-alt-row">
                  <button type="button" class="login-alt-link" @click="switchLoginMode('card')">
                    <CreditCard :size="32" :stroke-width="2.2" />
                    <span>刷卡登录</span>
                  </button>
                  <button type="button" class="login-alt-link" @click="switchLoginMode('face')">
                    <ScanFace :size="32" :stroke-width="2.2" />
                    <span>刷脸登录</span>
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
                    <div class="face-processing-title">正在识别人脸</div>
                    <div class="face-processing-steps">
                      <span>采集图像</span>
                      <span>活体检测</span>
                      <span>身份比对</span>
                    </div>
                  </div>
                  <div v-else class="face-camera-text">请对准摄像头进行人脸识别</div>
                </div>

                <div class="login-alt-divider face-alt-divider">
                  <span></span>
                  <strong>其他登录</strong>
                  <span></span>
                </div>

                <div class="login-alt-row">
                  <button type="button" class="login-alt-link" @click="switchLoginMode('account')">
                    <User :size="32" :stroke-width="2.2" />
                    <span>账号密码登录</span>
                  </button>
                  <button type="button" class="login-alt-link" @click="switchLoginMode('card')">
                    <CreditCard :size="32" :stroke-width="2.2" />
                    <span>刷卡登录</span>
                  </button>
                </div>
              </div>

              <div v-else class="face-login-body">
                <div class="card-reader-panel" @click="emit('login')">
                  <div class="card-reader-icon">
                    <CreditCard :size="32" :stroke-width="2.2" />
                  </div>
                  <div class="card-reader-title">请将工牌靠近读卡区</div>
                  <div class="card-reader-subtitle">系统将自动识别卡号并完成身份验证</div>
                </div>

                <div class="login-alt-divider face-alt-divider">
                  <span></span>
                  <strong>其他登录</strong>
                  <span></span>
                </div>

                <div class="login-alt-row">
                  <button type="button" class="login-alt-link" @click="switchLoginMode('account')">
                    <User :size="32" :stroke-width="2.2" />
                    <span>账号密码登录</span>
                  </button>
                  <button type="button" class="login-alt-link" @click="switchLoginMode('face')">
                    <ScanFace :size="32" :stroke-width="2.2" />
                    <span>刷脸登录</span>
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
