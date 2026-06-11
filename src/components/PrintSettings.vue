<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import {
  ArrowLeftRight,
  ArrowUpDown,
  Printer,
  QrCode,
  Ruler,
  Save,
  TestTube2,
} from 'lucide-vue-next';

type StatusTone = 'idle' | 'running' | 'normal' | 'fault';
type PrintOptionKey = 'exchange' | 'adminDirect' | 'adminAuthorized' | 'qrCode';

const statusMessage = ref('打印设置待机，可调整打印机、自动打印和纸张参数。');
const statusTone = ref<StatusTone>('idle');

const printerOptions = [
  'Brightek WH-POS58',
  'ZJ-NC 内置热敏打印机',
  'USB-POS58 Receipt',
  'Network-POS80',
];

const printOptions: Array<{ key: PrintOptionKey; label: string; description: string; icon: typeof Printer }> = [
  { key: 'exchange', label: '换针', description: '换针流程完成后自动打印记录', icon: Printer },
  { key: 'adminDirect', label: '管理员直接领针', description: '管理员直接领针后自动打印凭证', icon: Printer },
  { key: 'adminAuthorized', label: '管理员授权领针', description: '授权领针完成后自动打印凭证', icon: Printer },
  { key: 'qrCode', label: '打印二维码开关', description: '打印凭证中附带二维码信息', icon: QrCode },
];

const form = reactive({
  printer: printerOptions[0],
  printEnabled: true,
  autoPrint: {
    exchange: true,
    adminDirect: true,
    adminAuthorized: true,
    qrCode: true,
  } satisfies Record<PrintOptionKey, boolean>,
  customParams: false,
  xOffset: 0,
  yOffset: 0,
  xLength: 58,
  yLength: 40,
});

const enabledAutoPrintCount = computed(() => Object.values(form.autoPrint).filter(Boolean).length);
const printStateText = computed(() => (form.printEnabled ? '打印功能已启用' : '打印功能已停止'));
const customParamState = computed(() => (form.customParams ? '使用自定义打印参数' : '使用默认打印参数'));

const setStatus = (message: string, tone: StatusTone = 'running') => {
  statusMessage.value = message;
  statusTone.value = tone;
};

const setPrintEnabled = (enabled: boolean) => {
  form.printEnabled = enabled;
  setStatus(enabled ? '打印功能已启用。' : '打印功能已停止，自动打印策略将暂不执行。');
};

const setAutoPrint = (key: PrintOptionKey, enabled: boolean) => {
  form.autoPrint[key] = enabled;
  const label = printOptions.find(option => option.key === key)?.label ?? '';
  setStatus(`${label}已设置为${enabled ? '打印' : '不打印'}。`);
};

const setCustomParams = (enabled: boolean) => {
  form.customParams = enabled;
  setStatus(enabled ? '已启用自定义打印参数。' : '已切换为默认打印参数。');
};

const testPrint = () => {
  if (!form.printEnabled) {
    setStatus('打印功能已停止，无法执行测试打印。', 'fault');
    return;
  }
  if (!form.printer) {
    setStatus('请选择打印机后再测试打印。', 'fault');
    return;
  }
  setStatus(`测试打印已发送至 ${form.printer}。`, 'running');
};

const applyPrintSettings = () => {
  setStatus(
    form.printEnabled
      ? `打印设置已应用：${form.printer}，${enabledAutoPrintCount.value} 项自动打印开启。`
      : '打印设置已应用：打印功能停止。',
    'normal',
  );
};

const applyPrintProperties = () => {
  setStatus(
    form.customParams
      ? `打印属性已应用：横向偏移 ${form.xOffset}，纵向偏移 ${form.yOffset}，横向长度 ${form.xLength}，纵向长度 ${form.yLength}。`
      : '打印属性已应用：使用默认打印参数。',
    'normal',
  );
};
</script>

<template>
  <div class="org-page print-settings-page">
    <div class="org-header print-settings-header">
      <div>
        <h1>打印设置</h1>
      </div>
      <div :class="['face-debug-status-pill', statusTone]">
        <span></span>
        {{ statusMessage }}
      </div>
    </div>

    <div class="print-settings-layout">
      <section class="org-form-card print-settings-card">
        <div class="role-list-head print-settings-section-head">
          <div class="org-section-heading">
            <span></span>
            <h2>打印设置</h2>
          </div>
          <div class="print-settings-actions">
            <button type="button" class="org-secondary-btn print-settings-small-btn" @click="testPrint">
              <TestTube2 :size="18" :stroke-width="2.1" />
              测试打印
            </button>
            <button type="button" class="org-primary-btn print-settings-small-btn" @click="applyPrintSettings">
              <Save :size="18" :stroke-width="2.1" />
              应用
            </button>
          </div>
        </div>

        <label class="print-settings-field">
          <span>
            <Printer :size="22" :stroke-width="2.1" />
            打印机
          </span>
          <select v-model="form.printer">
            <option v-for="printer in printerOptions" :key="printer" :value="printer">{{ printer }}</option>
          </select>
        </label>

        <div class="print-option-row">
          <div class="print-option-label">
            <Printer :size="24" :stroke-width="2.1" />
            打印开关
          </div>
          <div class="media-segmented print-toggle">
            <button type="button" :class="{ active: form.printEnabled }" @click="setPrintEnabled(true)">打印</button>
            <button type="button" :class="{ active: !form.printEnabled }" @click="setPrintEnabled(false)">不打印</button>
          </div>
        </div>

        <div class="print-auto-list">
          <div v-for="option in printOptions" :key="option.key" class="print-auto-row">
            <div class="print-auto-copy">
              <component :is="option.icon" :size="24" :stroke-width="2.1" />
              <div>
                <strong>{{ option.label }}</strong>
                <span>{{ option.description }}</span>
              </div>
            </div>
            <div class="media-segmented print-toggle">
              <button type="button" :class="{ active: form.autoPrint[option.key] }" @click="setAutoPrint(option.key, true)">打印</button>
              <button type="button" :class="{ active: !form.autoPrint[option.key] }" @click="setAutoPrint(option.key, false)">不打印</button>
            </div>
          </div>
        </div>
      </section>

      <section class="org-form-card print-settings-card">
        <div class="role-list-head print-settings-section-head">
          <div class="org-section-heading">
            <span></span>
            <h2>打印属性设置</h2>
          </div>
          <button type="button" class="org-primary-btn print-settings-small-btn" @click="applyPrintProperties">
            <Save :size="18" :stroke-width="2.1" />
            应用
          </button>
        </div>

        <div class="print-option-row">
          <div class="print-option-label">
            <Ruler :size="24" :stroke-width="2.1" />
            自定义打印参数
          </div>
          <div class="media-segmented print-toggle">
            <button type="button" :class="{ active: form.customParams }" @click="setCustomParams(true)">是</button>
            <button type="button" :class="{ active: !form.customParams }" @click="setCustomParams(false)">否</button>
          </div>
        </div>

        <div class="print-parameter-grid">
          <label class="print-parameter-field">
            <span>
              <ArrowLeftRight :size="20" :stroke-width="2.1" />
              横向偏移
            </span>
            <input v-model.number="form.xOffset" type="number" min="-50" max="50" step="1" :disabled="!form.customParams" />
          </label>
          <label class="print-parameter-field">
            <span>
              <ArrowUpDown :size="20" :stroke-width="2.1" />
              纵向偏移
            </span>
            <input v-model.number="form.yOffset" type="number" min="-50" max="50" step="1" :disabled="!form.customParams" />
          </label>
          <label class="print-parameter-field">
            <span>
              <ArrowLeftRight :size="20" :stroke-width="2.1" />
              横向长度
            </span>
            <input v-model.number="form.xLength" type="number" min="1" max="120" step="1" :disabled="!form.customParams" />
          </label>
          <label class="print-parameter-field">
            <span>
              <ArrowUpDown :size="20" :stroke-width="2.1" />
              纵向长度
            </span>
            <input v-model.number="form.yLength" type="number" min="1" max="200" step="1" :disabled="!form.customParams" />
          </label>
        </div>

        <div class="print-summary">
          <span>当前策略</span>
          <strong>{{ printStateText }}，{{ customParamState }}。</strong>
        </div>
      </section>
    </div>
  </div>
</template>
