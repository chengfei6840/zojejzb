<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import {
  Camera,
  DoorOpen,
  Lightbulb,
  PackageOpen,
  Play,
  RotateCw,
  Save,
  X,
  Zap,
} from 'lucide-vue-next';

type StatusTone = 'idle' | 'running' | 'normal' | 'fault';
type DialogMode = 'agingConfirm' | 'agingProgress' | 'testConfirm' | 'testProgress' | null;

const lightModes = ['单色常亮', '单色滚动', '单色呼吸灯', '多彩流水灯', '单色闪烁'];
const lightColors = [
  { label: '蓝色', value: '#1d9bf0' },
  { label: '红色', value: '#ef4444' },
  { label: '绿色', value: '#18b365' },
  { label: '橙色', value: '#f97316' },
  { label: '灰色', value: '#64748b' },
  { label: '黄色', value: '#facc15' },
  { label: '白色', value: '#ffffff' },
];

const statusMessage = ref('控制器调试待机，可选择灯带参数或执行单项控制指令。');
const statusTone = ref<StatusTone>('idle');
const activeDialog = ref<DialogMode>(null);

const form = reactive({
  lightMode: lightModes[0],
  lightColor: lightColors[0].label,
});

const switches = reactive({
  takeNeedleLight: false,
  wasteNeedleLight: false,
  cameraLight: false,
  demagnetizer: false,
  refillBin: false,
  wasteDoor: false,
});

const selectedColor = computed(() => lightColors.find(item => item.label === form.lightColor) ?? lightColors[0]);
const packageActionTitle = computed(() => (activeDialog.value === 'agingConfirm' || activeDialog.value === 'agingProgress' ? '老化包针机构' : '测试包针机构'));

const setStatus = (message: string, tone: StatusTone = 'running') => {
  statusMessage.value = message;
  statusTone.value = tone;
};

const applyLightSetting = () => {
  setStatus(`灯带设置已下发：${form.lightMode} / ${form.lightColor}。`, 'normal');
};

const toggleSwitch = (key: keyof typeof switches, onText: string, offText: string) => {
  switches[key] = !switches[key];
  setStatus(switches[key] ? onText : offText, 'running');
};

const openPackageDialog = (mode: 'aging' | 'test') => {
  activeDialog.value = mode === 'aging' ? 'agingConfirm' : 'testConfirm';
};

const startPackageAction = () => {
  const isAging = activeDialog.value === 'agingConfirm';
  activeDialog.value = isAging ? 'agingProgress' : 'testProgress';
  setStatus(`${isAging ? '老化' : '测试'}包针机构指令已下发，等待控制器反馈。`);
};

const stopPackageAction = () => {
  setStatus(`${packageActionTitle.value}已停止。`, 'normal');
  activeDialog.value = null;
};

const closeDialog = () => {
  activeDialog.value = null;
};
</script>

<template>
  <div class="org-page controller-debug-page">
    <div class="org-header controller-debug-header">
      <div>
        <h1>控制器调试</h1>
      </div>
      <div :class="['face-debug-status-pill', statusTone]">
        <span></span>
        {{ statusMessage }}
      </div>
    </div>

    <div class="controller-debug-layout">
      <section class="org-form-card controller-debug-settings">
        <div class="role-list-head controller-debug-section-head">
          <div class="org-section-heading">
            <span></span>
            <h2>灯带设置</h2>
          </div>
          <button type="button" class="org-primary-btn controller-debug-small-btn" @click="applyLightSetting">
            <Save :size="18" :stroke-width="2.1" />
            下发设置
          </button>
        </div>

        <div class="controller-debug-form-grid">
          <label class="org-field">
            <span>灯带模式</span>
            <select v-model="form.lightMode" @change="applyLightSetting">
              <option v-for="mode in lightModes" :key="mode" :value="mode">{{ mode }}</option>
            </select>
          </label>
          <label class="org-field">
            <span>灯带颜色</span>
            <select v-model="form.lightColor" @change="applyLightSetting">
              <option v-for="color in lightColors" :key="color.label" :value="color.label">{{ color.label }}</option>
            </select>
          </label>
        </div>

        <div class="controller-light-preview">
          <div class="controller-light-strip" :style="{ '--strip-color': selectedColor.value }">
            <span v-for="index in 12" :key="index"></span>
          </div>
          <div class="controller-light-copy">
            <strong>{{ form.lightMode }}</strong>
            <span>{{ form.lightColor }}灯带预览</span>
          </div>
        </div>
      </section>

      <section class="org-list-card controller-debug-panel">
        <div class="org-section-heading">
          <span></span>
          <h2>控制器状态</h2>
        </div>
        <div class="controller-status-grid">
          <div>
            <span>通信状态</span>
            <strong>正常</strong>
          </div>
          <div>
            <span>控制器地址</span>
            <strong>LAN-192.168.10.20</strong>
          </div>
          <div>
            <span>固件版本</span>
            <strong>V4.1.0</strong>
          </div>
          <div>
            <span>最后指令</span>
            <strong>{{ statusTone === 'idle' ? '无' : statusMessage }}</strong>
          </div>
        </div>
      </section>
    </div>

    <section class="org-list-card controller-command-panel">
      <div class="org-section-heading">
        <span></span>
        <h2>功能调试</h2>
      </div>
      <div class="controller-command-grid">
        <button type="button" class="org-primary-btn controller-command" @click="toggleSwitch('takeNeedleLight', '取针仓灯已打开。', '取针仓灯已关闭。')">
          <Lightbulb :size="22" :stroke-width="2.1" />
          {{ switches.takeNeedleLight ? '关闭取针仓灯' : '打开取针仓灯' }}
        </button>
        <button type="button" class="org-primary-btn controller-command" @click="toggleSwitch('wasteNeedleLight', '废针仓灯已打开。', '废针仓灯已关闭。')">
          <Lightbulb :size="22" :stroke-width="2.1" />
          {{ switches.wasteNeedleLight ? '关闭废针仓灯' : '打开废针仓灯' }}
        </button>
        <button type="button" class="org-primary-btn controller-command" @click="toggleSwitch('cameraLight', '摄像头灯已打开。', '摄像头灯已关闭。')">
          <Camera :size="22" :stroke-width="2.1" />
          {{ switches.cameraLight ? '关闭摄像头灯' : '打开摄像头灯' }}
        </button>
        <button type="button" class="org-secondary-btn controller-command" @click="toggleSwitch('demagnetizer', '消磁器已打开。', '消磁器已关闭。')">
          <Zap :size="22" :stroke-width="2.1" />
          {{ switches.demagnetizer ? '关闭消磁器' : '打开消磁器' }}
        </button>
        <button type="button" class="org-secondary-btn controller-command" @click="toggleSwitch('refillBin', '补针仓已打开。', '补针仓已关闭。')">
          <PackageOpen :size="22" :stroke-width="2.1" />
          {{ switches.refillBin ? '关闭补针仓' : '打开补针仓' }}
        </button>
        <button type="button" class="org-secondary-btn controller-command" @click="toggleSwitch('wasteDoor', '废针仓门已打开。', '废针仓门已关闭。')">
          <DoorOpen :size="22" :stroke-width="2.1" />
          {{ switches.wasteDoor ? '关闭废针仓门' : '打开废针仓门' }}
        </button>
        <button type="button" class="org-secondary-btn controller-command" @click="openPackageDialog('aging')">
          <RotateCw :size="22" :stroke-width="2.1" />
          老化包针机构
        </button>
        <button type="button" class="org-secondary-btn controller-command" @click="openPackageDialog('test')">
          <Play :size="22" :stroke-width="2.1" />
          测试包针机构
        </button>
      </div>
    </section>

    <div v-if="activeDialog" class="role-permission-layer">
      <section class="component-dialog controller-debug-dialog">
        <div class="role-permission-header">
          <div>
            <h2>{{ packageActionTitle }}</h2>
            <p>集中控制器 · 包针机构</p>
          </div>
          <button type="button" @click="closeDialog">
            <X :size="28" />
          </button>
        </div>

        <div class="component-dialog-body">
          <div v-if="activeDialog === 'agingConfirm' || activeDialog === 'testConfirm'" class="component-confirm-copy">
            是否确认执行{{ packageActionTitle }}？
          </div>

          <div v-else class="controller-debug-progress">
            <div>
              <span>执行状态</span>
              <strong>运行中</strong>
            </div>
            <div>
              <span>当前阶段</span>
              <strong>{{ activeDialog === 'agingProgress' ? '连续循环' : '单次测试' }}</strong>
            </div>
            <div>
              <span>包针电机</span>
              <strong>已启动</strong>
            </div>
            <div>
              <span>控制反馈</span>
              <strong>等待完成</strong>
            </div>
          </div>
        </div>

        <div class="role-permission-actions">
          <button type="button" class="org-secondary-btn" @click="closeDialog">取消</button>
          <button v-if="activeDialog === 'agingConfirm' || activeDialog === 'testConfirm'" type="button" class="org-primary-btn" @click="startPackageAction">
            确定
          </button>
          <button v-else type="button" class="org-primary-btn danger-solid" @click="stopPackageAction">
            停止
          </button>
        </div>
      </section>
    </div>
  </div>
</template>
