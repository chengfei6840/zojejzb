<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import {
  BadgeCheck,
  CheckCircle2,
  Hammer,
  Magnet,
  MonitorCheck,
  Save,
  ScanBarcode,
  ShieldCheck,
  ShieldQuestion,
} from 'lucide-vue-next';

type StatusTone = 'idle' | 'running' | 'normal' | 'fault';
type FragmentOptionKey =
  | 'employeeMagnetCheck'
  | 'adminDeviceCheck'
  | 'xrayCheck'
  | 'destroyProductCheck'
  | 'safetyOfficerAuthorization'
  | 'needleDetectorNumberInput';

interface FragmentOption {
  key: FragmentOptionKey;
  label: string;
  description: string;
  icon: typeof Magnet;
}

const statusMessage = ref('异常针碎片丢失处理设置待机，可调整流程与核验节点。');
const statusTone = ref<StatusTone>('idle');

const form = reactive({
  flowEnabled: true,
  options: {
    employeeMagnetCheck: false,
    adminDeviceCheck: false,
    xrayCheck: false,
    destroyProductCheck: false,
    safetyOfficerAuthorization: false,
    needleDetectorNumberInput: false,
  } satisfies Record<FragmentOptionKey, boolean>,
});

const fragmentOptions: FragmentOption[] = [
  {
    key: 'employeeMagnetCheck',
    label: '员工使用磁棒检查',
    description: '要求员工使用磁棒排查遗失针碎片。',
    icon: Magnet,
  },
  {
    key: 'adminDeviceCheck',
    label: '管理员使用设备检查',
    description: '要求管理员通过设备执行复核检查。',
    icon: MonitorCheck,
  },
  {
    key: 'xrayCheck',
    label: 'X光机检查',
    description: '要求使用 X 光机对相关产品或区域进行检查。',
    icon: ScanBarcode,
  },
  {
    key: 'destroyProductCheck',
    label: '销毁产品检查',
    description: '要求对销毁产品执行检查确认。',
    icon: Hammer,
  },
  {
    key: 'safetyOfficerAuthorization',
    label: '需要安全员授权',
    description: '流程关键节点需要安全员授权后才能继续。',
    icon: ShieldCheck,
  },
  {
    key: 'needleDetectorNumberInput',
    label: '是否输入检针机编号',
    description: '要求登记本次检查使用的检针机编号。',
    icon: BadgeCheck,
  },
];

const enabledOptionCount = computed(() => (
  form.flowEnabled ? fragmentOptions.filter(option => form.options[option.key]).length : 0
));

const flowStateText = computed(() => (form.flowEnabled ? '流程已开启' : '流程已关闭'));

const setStatus = (message: string, tone: StatusTone = 'running') => {
  statusMessage.value = message;
  statusTone.value = tone;
};

const setFlowEnabled = (enabled: boolean) => {
  form.flowEnabled = enabled;
  setStatus(
    enabled
      ? '异常针碎片丢失处理流程已开启，可配置后续检查节点。'
      : '异常针碎片丢失处理流程已关闭，子检查节点暂不生效。',
  );
};

const setOptionEnabled = (key: FragmentOptionKey, enabled: boolean) => {
  if (!form.flowEnabled) {
    setStatus('请先开启异常针碎片丢失处理流程。', 'fault');
    return;
  }

  form.options[key] = enabled;
  const label = fragmentOptions.find(option => option.key === key)?.label ?? '';
  setStatus(`${label}已${enabled ? '开启' : '关闭'}。`);
};

const applySettings = () => {
  setStatus(
    form.flowEnabled
      ? `异常针碎片丢失处理设置已应用：${enabledOptionCount.value} 个检查节点开启。`
      : '异常针碎片丢失处理设置已应用：流程关闭。',
    'normal',
  );
};
</script>

<template>
  <div class="org-page fragment-loss-page">
    <div class="org-header fragment-loss-header">
      <div>
        <h1>异常针碎片丢失处理设置</h1>
      </div>
      <div :class="['face-debug-status-pill', statusTone]">
        <span></span>
        {{ statusMessage }}
      </div>
    </div>

    <div class="fragment-loss-layout">
      <section class="org-form-card fragment-loss-control-card">
        <div class="role-list-head fragment-loss-section-head">
          <div class="org-section-heading">
            <span></span>
            <h2>处理流程</h2>
          </div>
          <button type="button" class="org-primary-btn fragment-loss-small-btn" @click="applySettings">
            <Save :size="18" :stroke-width="2.1" />
            应用
          </button>
        </div>

        <div class="fragment-flow-card">
          <div class="fragment-flow-icon">
            <ShieldQuestion :size="42" :stroke-width="2.1" />
          </div>
          <div class="fragment-flow-copy">
            <strong>是否开启针碎片丢失处理流程</strong>
            <span>关闭后，下面的检查、授权和编号登记节点均不参与流程。</span>
          </div>
          <div class="media-segmented fragment-loss-toggle">
            <button type="button" :class="{ active: form.flowEnabled }" @click="setFlowEnabled(true)">开启</button>
            <button type="button" :class="{ active: !form.flowEnabled }" @click="setFlowEnabled(false)">关闭</button>
          </div>
        </div>

        <div class="fragment-loss-summary">
          <span>当前策略</span>
          <strong>
            <CheckCircle2 :size="18" :stroke-width="2.1" />
            {{ flowStateText }}，{{ enabledOptionCount }} 个节点开启
          </strong>
        </div>
      </section>

      <section class="org-form-card fragment-loss-options-card">
        <div class="org-section-heading">
          <span></span>
          <h2>检查与授权节点</h2>
        </div>

        <div :class="['fragment-loss-option-list', { disabled: !form.flowEnabled }]">
          <div v-for="option in fragmentOptions" :key="option.key" class="fragment-loss-option-row">
            <div class="fragment-loss-option-copy">
              <component :is="option.icon" :size="25" :stroke-width="2.1" />
              <div>
                <strong>{{ option.label }}</strong>
                <span>{{ option.description }}</span>
              </div>
            </div>
            <div class="media-segmented fragment-loss-toggle">
              <button
                type="button"
                :class="{ active: form.options[option.key] }"
                :disabled="!form.flowEnabled"
                @click="setOptionEnabled(option.key, true)"
              >
                开启
              </button>
              <button
                type="button"
                :class="{ active: !form.options[option.key] }"
                :disabled="!form.flowEnabled"
                @click="setOptionEnabled(option.key, false)"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
