<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import {
  Clock3,
  CreditCard,
  KeyRound,
  Save,
  ScanFace,
  ShieldCheck,
} from 'lucide-vue-next';

type StatusTone = 'idle' | 'running' | 'normal' | 'fault';
type LoginMethod = 'face' | 'card' | 'password';

interface LoginMethodOption {
  label: string;
  value: LoginMethod;
  description: string;
  icon: typeof ScanFace;
}

const statusMessage = ref('登录设置待机，可调整待机时间与登录方式策略。');
const statusTone = ref<StatusTone>('idle');

const standbyMinutes = [1, 3, 5, 10, 15, 30, 60];

const methodOptions: LoginMethodOption[] = [
  { label: '人脸识别', value: 'face', description: '通过摄像头识别操作人身份', icon: ScanFace },
  { label: '读卡识别', value: 'card', description: '通过员工卡或权限卡识别身份', icon: CreditCard },
  { label: '密码登录', value: 'password', description: '通过账号密码完成身份验证', icon: KeyRound },
];

const form = reactive({
  standbyTime: 5,
  preferredMethod: 'face' as LoginMethod,
  enabledMethods: {
    face: true,
    card: true,
    password: true,
  } satisfies Record<LoginMethod, boolean>,
});

const enabledMethodOptions = computed(() => methodOptions.filter(option => form.enabledMethods[option.value]));
const preferredMethodLabel = computed(() => methodOptions.find(option => option.value === form.preferredMethod)?.label ?? '未设置');

const setStatus = (message: string, tone: StatusTone = 'running') => {
  statusMessage.value = message;
  statusTone.value = tone;
};

const selectPreferredMethod = (method: LoginMethod) => {
  if (!form.enabledMethods[method]) {
    setStatus('该登录方式已关闭，不能设为首选。', 'fault');
    return;
  }
  form.preferredMethod = method;
  setStatus(`首选登录方式已切换为：${preferredMethodLabel.value}。`);
};

const toggleMethod = (method: LoginMethod) => {
  const nextValue = !form.enabledMethods[method];
  if (!nextValue && enabledMethodOptions.value.length <= 1) {
    setStatus('至少需要保留一种登录方式开启。', 'fault');
    return;
  }

  form.enabledMethods[method] = nextValue;

  if (!nextValue && form.preferredMethod === method) {
    form.preferredMethod = enabledMethodOptions.value[0]?.value ?? 'password';
  }

  const methodLabel = methodOptions.find(option => option.value === method)?.label ?? '';
  setStatus(`${methodLabel}已${nextValue ? '开启' : '关闭'}。`);
};

const applyLoginSettings = () => {
  if (!form.enabledMethods[form.preferredMethod]) {
    setStatus('首选登录方式必须保持开启。', 'fault');
    return;
  }

  setStatus(
    `登录设置已应用：待机 ${form.standbyTime} 分钟，首选 ${preferredMethodLabel.value}。`,
    'normal',
  );
};
</script>

<template>
  <div class="org-page login-settings-page">
    <div class="org-header login-settings-header">
      <div>
        <h1>登录设置</h1>
      </div>
      <div :class="['face-debug-status-pill', statusTone]">
        <span></span>
        {{ statusMessage }}
      </div>
    </div>

    <div class="login-settings-layout">
      <section class="org-form-card login-settings-card">
        <div class="role-list-head login-settings-section-head">
          <div class="org-section-heading">
            <span></span>
            <h2>登录策略</h2>
          </div>
          <button type="button" class="org-primary-btn login-settings-small-btn" @click="applyLoginSettings">
            <Save :size="18" :stroke-width="2.1" />
            应用
          </button>
        </div>

        <label class="login-settings-field">
          <span>
            <Clock3 :size="22" :stroke-width="2.1" />
            待机时间
          </span>
          <div class="login-standby-control">
            <select v-model.number="form.standbyTime">
              <option v-for="minute in standbyMinutes" :key="minute" :value="minute">{{ minute }}</option>
            </select>
            <strong>分钟</strong>
          </div>
        </label>

        <div class="login-preferred-panel">
          <div class="login-panel-title">
            <ShieldCheck :size="22" :stroke-width="2.1" />
            首选登录方式
          </div>
          <div class="login-method-grid">
            <button
              v-for="method in methodOptions"
              :key="method.value"
              type="button"
              :class="{ active: form.preferredMethod === method.value, disabled: !form.enabledMethods[method.value] }"
              @click="selectPreferredMethod(method.value)"
            >
              <component :is="method.icon" :size="24" :stroke-width="2.1" />
              <span>{{ method.label }}</span>
            </button>
          </div>
        </div>
      </section>

      <section class="org-form-card login-settings-card">
        <div class="org-section-heading">
          <span></span>
          <h2>登录方式启用</h2>
        </div>

        <div class="login-method-list">
          <div v-for="method in methodOptions" :key="method.value" class="login-method-row">
            <div class="login-method-copy">
              <component :is="method.icon" :size="28" :stroke-width="2.1" />
              <div>
                <strong>{{ method.label }}</strong>
                <span>{{ method.description }}</span>
              </div>
            </div>
            <div class="media-segmented login-enable-toggle">
              <button type="button" :class="{ active: form.enabledMethods[method.value] }" @click="!form.enabledMethods[method.value] && toggleMethod(method.value)">
                开启
              </button>
              <button type="button" :class="{ active: !form.enabledMethods[method.value] }" @click="form.enabledMethods[method.value] && toggleMethod(method.value)">
                关闭
              </button>
            </div>
          </div>
        </div>

        <div class="login-summary">
          <span>当前策略</span>
          <strong>待机 {{ form.standbyTime }} 分钟后返回首页，优先使用{{ preferredMethodLabel }}。</strong>
        </div>
      </section>
    </div>
  </div>
</template>
