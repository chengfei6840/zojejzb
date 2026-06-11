<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import {
  Archive,
  CheckCircle2,
  ClipboardCheck,
  PackageSearch,
  Save,
  ShieldCheck,
  UserCheck,
} from 'lucide-vue-next';

type StatusTone = 'idle' | 'running' | 'normal' | 'fault';
type ToggleKey =
  | 'useSpareWarehouse'
  | 'boundNeedleOnly'
  | 'exchangeSecondConfirm'
  | 'controlSpareSeparately'
  | 'batchExchangeSelectEmployee'
  | 'newUserDirectDispense'
  | 'autoExitAfterDispense'
  | 'preRecycleSchemeCheck'
  | 'recycleSuccessCheck';

interface ToggleOption {
  key: ToggleKey;
  label: string;
  description: string;
  group: 'stock' | 'exchange' | 'recycle';
}

const statusMessage = ref('基础参数设置待机，可调整库存、换领针与回收检测策略。');
const statusTone = ref<StatusTone>('idle');

const form = reactive({
  minStock: 5,
  toggles: {
    useSpareWarehouse: true,
    boundNeedleOnly: true,
    exchangeSecondConfirm: true,
    controlSpareSeparately: false,
    batchExchangeSelectEmployee: true,
    newUserDirectDispense: false,
    autoExitAfterDispense: false,
    preRecycleSchemeCheck: true,
    recycleSuccessCheck: true,
  } satisfies Record<ToggleKey, boolean>,
});

const toggleOptions: ToggleOption[] = [
  {
    key: 'useSpareWarehouse',
    label: '是否需操作备用仓',
    description: '换领针流程是否联动备用仓库存。',
    group: 'stock',
  },
  {
    key: 'controlSpareSeparately',
    label: '单独控制备用仓',
    description: '备用仓是否独立于主仓进行出入库控制。',
    group: 'stock',
  },
  {
    key: 'boundNeedleOnly',
    label: '用户只能换绑定的机针',
    description: '限制用户仅可换取已绑定范围内的机针。',
    group: 'exchange',
  },
  {
    key: 'exchangeSecondConfirm',
    label: '换针是否需要进行二次确认',
    description: '换针提交前要求再次确认所选针位与数量。',
    group: 'exchange',
  },
  {
    key: 'batchExchangeSelectEmployee',
    label: '批量换针时是否需要选择员工',
    description: '批量换针流程是否必须指定员工身份。',
    group: 'exchange',
  },
  {
    key: 'newUserDirectDispense',
    label: '新用户直接领针',
    description: '新建用户是否允许跳过额外授权直接领针。',
    group: 'exchange',
  },
  {
    key: 'autoExitAfterDispense',
    label: '领针后是否自动退出',
    description: '领针完成后是否自动退出当前登录状态，默认关闭。',
    group: 'exchange',
  },
  {
    key: 'preRecycleSchemeCheck',
    label: '回收前检测机针是否符合预设方案范围要求',
    description: '回收前按预设方案范围校验机针信息。',
    group: 'recycle',
  },
  {
    key: 'recycleSuccessCheck',
    label: '检测回收机针是否成功',
    description: '回收完成后是否进行成功状态检测。',
    group: 'recycle',
  },
];

const enabledCount = computed(() => toggleOptions.filter(option => form.toggles[option.key]).length);
const stockOptions = computed(() => toggleOptions.filter(option => option.group === 'stock'));
const exchangeOptions = computed(() => toggleOptions.filter(option => option.group === 'exchange'));
const recycleOptions = computed(() => toggleOptions.filter(option => option.group === 'recycle'));

const setStatus = (message: string, tone: StatusTone = 'running') => {
  statusMessage.value = message;
  statusTone.value = tone;
};

const setToggle = (key: ToggleKey, enabled: boolean) => {
  form.toggles[key] = enabled;
  const label = toggleOptions.find(option => option.key === key)?.label ?? '';
  setStatus(`${label}已设置为${enabled ? '是' : '否'}。`);
};

const normalizeMinStock = () => {
  const nextValue = Number.isFinite(form.minStock) ? Math.round(form.minStock) : 0;
  form.minStock = Math.min(Math.max(nextValue, 0), 999);
};

const applyParameters = () => {
  normalizeMinStock();
  setStatus(`基础参数已应用：最低库存 ${form.minStock}，${enabledCount.value} 项策略开启。`, 'normal');
};
</script>

<template>
  <div class="org-page basic-parameter-page">
    <div class="org-header basic-parameter-header">
      <div>
        <h1>基础参数设置</h1>
      </div>
      <div :class="['face-debug-status-pill', statusTone]">
        <span></span>
        {{ statusMessage }}
      </div>
    </div>

    <div class="basic-parameter-layout">
      <section class="org-form-card basic-parameter-card">
        <div class="role-list-head basic-parameter-section-head">
          <div class="org-section-heading">
            <span></span>
            <h2>库存与仓位</h2>
          </div>
          <button type="button" class="org-primary-btn basic-parameter-small-btn" @click="applyParameters">
            <Save :size="18" :stroke-width="2.1" />
            应用
          </button>
        </div>

        <label class="basic-parameter-field">
          <span>
            <PackageSearch :size="22" :stroke-width="2.1" />
            设置最低库存
          </span>
          <input v-model.number="form.minStock" type="number" min="0" max="999" step="1" @blur="normalizeMinStock" />
        </label>

        <div class="basic-toggle-list compact">
          <div v-for="option in stockOptions" :key="option.key" class="basic-toggle-row">
            <div class="basic-toggle-copy">
              <Archive :size="24" :stroke-width="2.1" />
              <div>
                <strong>{{ option.label }}</strong>
                <span>{{ option.description }}</span>
              </div>
            </div>
            <div class="media-segmented basic-toggle-control">
              <button type="button" :class="{ active: form.toggles[option.key] }" @click="setToggle(option.key, true)">是</button>
              <button type="button" :class="{ active: !form.toggles[option.key] }" @click="setToggle(option.key, false)">否</button>
            </div>
          </div>
        </div>
      </section>

      <section class="org-form-card basic-parameter-card">
        <div class="org-section-heading">
          <span></span>
          <h2>换领针策略</h2>
        </div>
        <div class="basic-toggle-list">
          <div v-for="option in exchangeOptions" :key="option.key" class="basic-toggle-row">
            <div class="basic-toggle-copy">
              <UserCheck :size="24" :stroke-width="2.1" />
              <div>
                <strong>{{ option.label }}</strong>
                <span>{{ option.description }}</span>
              </div>
            </div>
            <div class="media-segmented basic-toggle-control">
              <button type="button" :class="{ active: form.toggles[option.key] }" @click="setToggle(option.key, true)">是</button>
              <button type="button" :class="{ active: !form.toggles[option.key] }" @click="setToggle(option.key, false)">否</button>
            </div>
          </div>
        </div>
      </section>

      <section class="org-form-card basic-parameter-card">
        <div class="org-section-heading">
          <span></span>
          <h2>回收检测策略</h2>
        </div>
        <div class="basic-toggle-list compact">
          <div v-for="option in recycleOptions" :key="option.key" class="basic-toggle-row">
            <div class="basic-toggle-copy">
              <ShieldCheck v-if="option.key === 'preRecycleSchemeCheck'" :size="24" :stroke-width="2.1" />
              <ClipboardCheck v-else :size="24" :stroke-width="2.1" />
              <div>
                <strong>{{ option.label }}</strong>
                <span>{{ option.description }}</span>
              </div>
            </div>
            <div class="media-segmented basic-toggle-control">
              <button type="button" :class="{ active: form.toggles[option.key] }" @click="setToggle(option.key, true)">是</button>
              <button type="button" :class="{ active: !form.toggles[option.key] }" @click="setToggle(option.key, false)">否</button>
            </div>
          </div>
        </div>

        <div class="basic-parameter-summary">
          <span>当前策略</span>
          <strong>
            <CheckCircle2 :size="18" :stroke-width="2.1" />
            最低库存 {{ form.minStock }}，{{ enabledCount }} 项策略开启
          </strong>
        </div>
      </section>
    </div>
  </div>
</template>
