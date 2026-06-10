<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import {
  Boxes,
  CheckCircle2,
  CircleAlert,
  Cog,
  PackageOpen,
  Play,
  RefreshCw,
  RotateCcw,
  Save,
  SlidersHorizontal,
  X,
  Zap,
} from 'lucide-vue-next';
import { MOCK_SLOTS } from '../constants';

type DialogMode = 'dispense' | 'agingConfirm' | 'agingProgress' | 'simulateConfirm' | 'simulateProgress' | null;
type LongRunMode = 'aging' | 'simulate';

const defaultParameters = {
  leverMinSpeed: 50,
  leverMaxSpeed: 50,
  vibrationMinSpeed: 50,
  vibrationMaxSpeed: 50,
  vibrationMinTime: 200,
  vibrationMaxTime: 2000,
};

const slotOptions = MOCK_SLOTS.map(slot => ({
  id: slot.id,
  number: slot.number,
  stock: slot.count,
}));

const selectedSlotNo = ref(slotOptions[0]?.number ?? '01');
const statusMessage = ref('针盒调试待机，选择针位后可下发参数或执行单项测试。');
const statusTone = ref<'idle' | 'running' | 'normal' | 'fault'>('idle');
const isRefillDoorOpen = ref(false);
const isRefilling = ref(false);
const activeDialog = ref<DialogMode>(null);
const longRunMode = ref<LongRunMode>('aging');

const form = reactive({
  refillQuantity: 1,
  dispenseQuantity: 1,
  ...defaultParameters,
});

const selectedSlot = computed(() => slotOptions.find(slot => slot.number === selectedSlotNo.value) ?? slotOptions[0]);
const systemStock = computed(() => selectedSlot.value?.stock ?? 0);
const progressTitle = computed(() => (longRunMode.value === 'aging' ? '设备老化' : '模拟取针'));

const setStatus = (message: string, tone: 'idle' | 'running' | 'normal' | 'fault' = 'running') => {
  statusMessage.value = message;
  statusTone.value = tone;
};

const testMotor = (name: string) => {
  setStatus(`正在测试${name}，测试指令已下发到设备。`);
};

const toggleRefillDoor = () => {
  isRefillDoorOpen.value = !isRefillDoorOpen.value;
  setStatus(isRefillDoorOpen.value ? '正在打开补针仓，设备补针仓已进入打开流程。' : '正在关闭补针仓，设备补针仓已进入关闭流程。');
};

const toggleRefill = () => {
  if (!isRefilling.value) {
    isRefilling.value = true;
    isRefillDoorOpen.value = true;
    setStatus('移动针盒 -> 正在打开补针仓。');
    return;
  }
  isRefilling.value = false;
  isRefillDoorOpen.value = false;
  setStatus('正在关闭补针仓。');
};

const resetParameters = () => {
  Object.assign(form, {
    refillQuantity: 1,
    dispenseQuantity: 1,
    ...defaultParameters,
  });
  setStatus('参数已重置为默认值。', 'normal');
};

const saveParameters = () => {
  setStatus(`针位 ${selectedSlotNo.value} 的针盒参数已保存到当前调试会话。`, 'normal');
};

const dispenseNeedle = (withParameters: boolean) => {
  activeDialog.value = null;
  setStatus(withParameters ? '正在取针，已下发当前针位参数。' : '正在取针，本次不下发参数。');
};

const alignZero = () => {
  setStatus('零位未对齐，正在回零。', 'fault');
};

const openLongRunConfirm = (mode: LongRunMode) => {
  longRunMode.value = mode;
  activeDialog.value = mode === 'aging' ? 'agingConfirm' : 'simulateConfirm';
};

const startLongRun = () => {
  activeDialog.value = longRunMode.value === 'aging' ? 'agingProgress' : 'simulateProgress';
  setStatus(`${progressTitle.value}模式已启动，针盒正在执行回零。`);
};

const stopLongRun = () => {
  setStatus(`${progressTitle.value}已停止。`, 'normal');
  activeDialog.value = null;
};

const closeDialog = () => {
  activeDialog.value = null;
};
</script>

<template>
  <div class="org-page needle-box-page">
    <div class="org-header needle-box-header">
      <div>
        <h1>针盒调试</h1>
      </div>
      <div :class="['face-debug-status-pill', statusTone]">
        <span></span>
        {{ statusMessage }}
      </div>
    </div>

    <div class="needle-box-layout">
      <section class="org-form-card needle-box-panel needle-box-parameters">
        <div class="role-list-head needle-box-section-head">
          <div class="org-section-heading">
            <span></span>
            <h2>调试参数</h2>
          </div>
          <div class="needle-box-param-actions">
            <button type="button" class="org-secondary-btn needle-box-small-btn" @click="resetParameters">
              <RotateCcw :size="18" :stroke-width="2.1" />
              重置参数
            </button>
            <button type="button" class="org-primary-btn needle-box-small-btn" @click="saveParameters">
              <Save :size="18" :stroke-width="2.1" />
              保存参数
            </button>
          </div>
        </div>

        <div class="needle-box-form-grid">
          <label class="org-field">
            <span>针位编号</span>
            <select v-model="selectedSlotNo">
              <option v-for="slot in slotOptions" :key="slot.id" :value="slot.number">{{ slot.number }}</option>
            </select>
          </label>
          <label class="org-field">
            <span>补针数量</span>
            <input v-model.number="form.refillQuantity" type="number" min="1" max="3" />
          </label>
          <label class="org-field">
            <span>取针数量</span>
            <input v-model.number="form.dispenseQuantity" type="number" min="1" max="50" />
          </label>
          <label class="org-field">
            <span>系统库存</span>
            <input :value="systemStock" type="number" readonly />
          </label>
        </div>

        <div class="needle-box-slider-list">
          <label class="needle-position-slider">
            <span>拨杆电机最小速度</span>
            <input v-model.number="form.leverMinSpeed" type="range" min="0" max="100" />
            <strong>{{ form.leverMinSpeed }}</strong>
          </label>
          <label class="needle-position-slider">
            <span>拨杆电机最大速度</span>
            <input v-model.number="form.leverMaxSpeed" type="range" min="0" max="100" />
            <strong>{{ form.leverMaxSpeed }}</strong>
          </label>
          <label class="needle-position-slider">
            <span>振动电机最小速度</span>
            <input v-model.number="form.vibrationMinSpeed" type="range" min="0" max="100" />
            <strong>{{ form.vibrationMinSpeed }}</strong>
          </label>
          <label class="needle-position-slider">
            <span>振动电机最大速度</span>
            <input v-model.number="form.vibrationMaxSpeed" type="range" min="0" max="100" />
            <strong>{{ form.vibrationMaxSpeed }}</strong>
          </label>
          <label class="needle-position-slider">
            <span>最小振动时间</span>
            <input v-model.number="form.vibrationMinTime" type="range" min="0" max="5000" />
            <strong>{{ form.vibrationMinTime }}</strong>
          </label>
          <label class="needle-position-slider">
            <span>最大振动时间</span>
            <input v-model.number="form.vibrationMaxTime" type="range" min="0" max="5000" />
            <strong>{{ form.vibrationMaxTime }}</strong>
          </label>
        </div>
      </section>

      <section class="org-list-card needle-box-panel needle-box-command-panel">
        <div class="org-section-heading">
          <span></span>
          <h2>功能调试</h2>
        </div>
        <div class="needle-box-command-grid">
          <button type="button" class="org-primary-btn needle-box-command" @click="testMotor('定位电机')">
            <Cog :size="22" :stroke-width="2.1" />
            定位电机
          </button>
          <button type="button" class="org-primary-btn needle-box-command" @click="testMotor('拨杆电机')">
            <SlidersHorizontal :size="22" :stroke-width="2.1" />
            拨杆电机
          </button>
          <button type="button" class="org-primary-btn needle-box-command" @click="testMotor('振动电机')">
            <Zap :size="22" :stroke-width="2.1" />
            振动电机
          </button>
          <button type="button" class="org-secondary-btn needle-box-command" @click="toggleRefillDoor">
            <PackageOpen :size="22" :stroke-width="2.1" />
            {{ isRefillDoorOpen ? '关闭补针仓' : '打开补针仓' }}
          </button>
          <button type="button" class="org-primary-btn needle-box-command" @click="toggleRefill">
            <Boxes :size="22" :stroke-width="2.1" />
            {{ isRefilling ? '结束补针' : '开始补针' }}
          </button>
          <button type="button" class="org-primary-btn needle-box-command" @click="activeDialog = 'dispense'">
            <Play :size="22" :stroke-width="2.1" />
            取针
          </button>
          <button type="button" class="org-secondary-btn needle-box-command" @click="alignZero">
            <RefreshCw :size="22" :stroke-width="2.1" />
            零位对齐
          </button>
          <button type="button" class="org-secondary-btn needle-box-command" @click="openLongRunConfirm('aging')">
            <CircleAlert :size="22" :stroke-width="2.1" />
            设备老化
          </button>
          <button type="button" class="org-secondary-btn needle-box-command" @click="openLongRunConfirm('simulate')">
            <CheckCircle2 :size="22" :stroke-width="2.1" />
            模拟取针
          </button>
        </div>
      </section>
    </div>

    <div v-if="activeDialog" class="role-permission-layer">
      <section class="component-dialog needle-box-dialog">
        <div class="role-permission-header">
          <div>
            <h2 v-if="activeDialog === 'dispense'">取针</h2>
            <h2 v-else-if="activeDialog === 'agingConfirm'">设备老化</h2>
            <h2 v-else-if="activeDialog === 'simulateConfirm'">模拟取针</h2>
            <h2 v-else>{{ progressTitle }}</h2>
            <p>当前针位 {{ selectedSlotNo }}</p>
          </div>
          <button type="button" @click="closeDialog">
            <X :size="28" />
          </button>
        </div>

        <div class="component-dialog-body">
          <div v-if="activeDialog === 'dispense'" class="needle-box-choice-list">
            <button type="button" @click="dispenseNeedle(false)">取针（不下发参数）</button>
            <button type="button" @click="dispenseNeedle(true)">取针（下发参数）</button>
          </div>

          <div v-else-if="activeDialog === 'agingConfirm' || activeDialog === 'simulateConfirm'" class="component-confirm-copy">
            {{ activeDialog === 'agingConfirm' ? '是否进入设备老化的模式？' : '是否要进行模拟取针？' }}
          </div>

          <div v-else class="needle-box-progress">
            <div>
              <span>针位编号</span>
              <strong>{{ selectedSlotNo }}</strong>
            </div>
            <div>
              <span>测试时长</span>
              <strong>{{ longRunMode === 'aging' ? '00:12:40' : '00:03:20' }}</strong>
            </div>
            <div>
              <span>总进度</span>
              <strong>{{ longRunMode === 'aging' ? '35%' : '20%' }}</strong>
            </div>
            <div>
              <span>针盒回零</span>
              <strong>执行中</strong>
            </div>
          </div>
        </div>

        <div class="role-permission-actions">
          <button type="button" class="org-secondary-btn" @click="closeDialog">
            {{ activeDialog === 'agingProgress' || activeDialog === 'simulateProgress' ? '取消' : '取消' }}
          </button>
          <button v-if="activeDialog === 'agingConfirm' || activeDialog === 'simulateConfirm'" type="button" class="org-primary-btn" @click="startLongRun">确定</button>
          <button v-else-if="activeDialog === 'agingProgress' || activeDialog === 'simulateProgress'" type="button" class="org-primary-btn danger-solid" @click="stopLongRun">停止老化设备</button>
        </div>
      </section>
    </div>
  </div>
</template>
