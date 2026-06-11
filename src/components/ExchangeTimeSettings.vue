<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import {
  Ban,
  BellRing,
  CheckCircle2,
  Clock3,
  Hash,
  Repeat2,
  Save,
  TimerReset,
} from 'lucide-vue-next';

type StatusTone = 'idle' | 'running' | 'normal' | 'fault';
type ExchangeTimeToggleKey = 'frequentExchangePrompt' | 'minIntervalBlocking' | 'timeoutReminder';

interface ExchangeTimeToggle {
  key: ExchangeTimeToggleKey;
  label: string;
  description: string;
  icon: typeof BellRing;
}

const statusMessage = ref('换针时间设置待机，可调整频繁换针、最小间隔与超时提醒策略。');
const statusTone = ref<StatusTone>('idle');

const form = reactive({
  toggles: {
    frequentExchangePrompt: false,
    minIntervalBlocking: false,
    timeoutReminder: false,
  } satisfies Record<ExchangeTimeToggleKey, boolean>,
  minIntervalMinutes: 5,
  timeoutHours: 0.5,
  dailyMaxExchanges: -1,
});

const toggleOptions: ExchangeTimeToggle[] = [
  {
    key: 'frequentExchangePrompt',
    label: '频繁换针提示',
    description: '员工在短时间内多次换针时进行提示。',
    icon: BellRing,
  },
  {
    key: 'minIntervalBlocking',
    label: '低于最小间隔时间禁止换针',
    description: '换针间隔低于配置值时禁止继续换针。',
    icon: Ban,
  },
  {
    key: 'timeoutReminder',
    label: '换针超时提醒',
    description: '超过配置时长后提醒处理换针超时。',
    icon: TimerReset,
  },
];

const enabledToggleCount = computed(() => toggleOptions.filter(option => form.toggles[option.key]).length);
const dailyMaxText = computed(() => (form.dailyMaxExchanges === -1 ? '不限制' : `${form.dailyMaxExchanges} 次`));

const setStatus = (message: string, tone: StatusTone = 'running') => {
  statusMessage.value = message;
  statusTone.value = tone;
};

const setToggle = (key: ExchangeTimeToggleKey, enabled: boolean) => {
  form.toggles[key] = enabled;
  const label = toggleOptions.find(option => option.key === key)?.label ?? '';
  setStatus(`${label}已设置为${enabled ? '是' : '否'}。`);
};

const normalizeMinInterval = () => {
  const value = Number.isFinite(form.minIntervalMinutes) ? Math.round(form.minIntervalMinutes) : 0;
  form.minIntervalMinutes = Math.min(Math.max(value, 0), 999);
};

const normalizeTimeoutHours = () => {
  const value = Number.isFinite(form.timeoutHours) ? form.timeoutHours : 0;
  form.timeoutHours = Math.min(Math.max(Math.round(value * 10) / 10, 0), 999);
};

const normalizeDailyMax = () => {
  const value = Number.isFinite(form.dailyMaxExchanges) ? Math.round(form.dailyMaxExchanges) : -1;
  form.dailyMaxExchanges = value < 0 ? -1 : Math.min(value, 9999);
};

const applySettings = () => {
  normalizeMinInterval();
  normalizeTimeoutHours();
  normalizeDailyMax();
  setStatus(
    `换针时间设置已应用：最小间隔 ${form.minIntervalMinutes} 分钟，超时 ${form.timeoutHours} 小时，当天最大 ${dailyMaxText.value}。`,
    'normal',
  );
};
</script>

<template>
  <div class="org-page exchange-time-page">
    <div class="org-header exchange-time-header">
      <div>
        <h1>换针时间设置</h1>
      </div>
      <div :class="['face-debug-status-pill', statusTone]">
        <span></span>
        {{ statusMessage }}
      </div>
    </div>

    <div class="exchange-time-layout">
      <section class="org-form-card exchange-time-card">
        <div class="role-list-head exchange-time-section-head">
          <div class="org-section-heading">
            <span></span>
            <h2>换针策略</h2>
          </div>
          <button type="button" class="org-primary-btn exchange-time-small-btn" @click="applySettings">
            <Save :size="18" :stroke-width="2.1" />
            应用
          </button>
        </div>

        <div class="exchange-time-toggle-list">
          <div v-for="option in toggleOptions" :key="option.key" class="exchange-time-toggle-row">
            <div class="exchange-time-toggle-copy">
              <component :is="option.icon" :size="26" :stroke-width="2.1" />
              <div>
                <strong>{{ option.label }}</strong>
                <span>{{ option.description }}</span>
              </div>
            </div>
            <div class="media-segmented exchange-time-toggle">
              <button type="button" :class="{ active: form.toggles[option.key] }" @click="setToggle(option.key, true)">是</button>
              <button type="button" :class="{ active: !form.toggles[option.key] }" @click="setToggle(option.key, false)">否</button>
            </div>
          </div>
        </div>
      </section>

      <section class="org-form-card exchange-time-card">
        <div class="org-section-heading">
          <span></span>
          <h2>时间与次数</h2>
        </div>

        <div class="exchange-time-field-list">
          <label class="exchange-time-field">
            <span>
              <Clock3 :size="22" :stroke-width="2.1" />
              最小换针间隔
            </span>
            <div class="exchange-time-input-unit">
              <input v-model.number="form.minIntervalMinutes" type="number" min="0" max="999" step="1" @blur="normalizeMinInterval" />
              <strong>分钟</strong>
            </div>
          </label>

          <label class="exchange-time-field">
            <span>
              <TimerReset :size="22" :stroke-width="2.1" />
              换针超时时间间隔
            </span>
            <div class="exchange-time-input-unit">
              <input v-model.number="form.timeoutHours" type="number" min="0" max="999" step="0.1" @blur="normalizeTimeoutHours" />
              <strong>小时</strong>
            </div>
          </label>

          <label class="exchange-time-field">
            <span>
              <Hash :size="22" :stroke-width="2.1" />
              当天最大换针次数
            </span>
            <div class="exchange-time-input-unit">
              <input v-model.number="form.dailyMaxExchanges" type="number" min="-1" max="9999" step="1" @blur="normalizeDailyMax" />
              <strong>{{ dailyMaxText }}</strong>
            </div>
          </label>
        </div>

        <div class="exchange-time-summary">
          <span>当前策略</span>
          <strong>
            <CheckCircle2 :size="18" :stroke-width="2.1" />
            {{ enabledToggleCount }} 项策略为是，最大换针次数 {{ dailyMaxText }}
          </strong>
        </div>
      </section>

      <section class="org-form-card exchange-time-overview-card">
        <div class="org-section-heading">
          <span></span>
          <h2>规则摘要</h2>
        </div>

        <div class="exchange-time-rule-panel">
          <Repeat2 :size="44" :stroke-width="2.1" />
          <div>
            <strong>{{ form.minIntervalMinutes }} 分钟</strong>
            <span>最小换针间隔</span>
          </div>
          <div>
            <strong>{{ form.timeoutHours }} 小时</strong>
            <span>超时提醒周期</span>
          </div>
          <div>
            <strong>{{ dailyMaxText }}</strong>
            <span>当天最大换针次数</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
