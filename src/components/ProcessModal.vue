<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { X, Camera, CheckCircle2, Loader2, Info, Download, User, Inbox, AlertTriangle, Pencil, Plus, Save, Trash2, CreditCard, Upload, Wrench, Repeat2 } from 'lucide-vue-next';
import type { NeedleSlot, ProcessPhase } from '../types';
import { EXCHANGE_REASONS, RETURN_REASONS } from '../constants';
import { cn } from '../lib/utils';

interface Props {
  phase: ProcessPhase;
  type: 'exchange' | 'return' | 'dispense' | 'replenish' | 'clear' | null;
  selectedSlot?: NeedleSlot | null;
  slots?: NeedleSlot[];
  selectedReason?: string;
  dispenseQuantity?: number;
  isAdmin?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  selectedSlot: null,
  slots: () => [],
  selectedReason: '',
  dispenseQuantity: 1,
  isAdmin: false,
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'next'): void;
  (e: 'exchangeSelectSlot', slot: NeedleSlot): void;
  (e: 'reasonSelect', reason: string): void;
  (e: 'dispenseQuantityChange', quantity: number): void;
  (e: 'recognitionFailed'): void;
  (e: 'restartExchangeFromSlot'): void;
}>();

const isOpen = computed(() => props.phase !== 'idle' && props.phase !== 'exchange_select_slot' && props.phase !== 'dispense_ready');
const exchangeReasonOptions = ref([...EXCHANGE_REASONS]);
const returnReasonOptions = ref([...RETURN_REASONS]);
const isReasonMaintenanceOpen = ref(false);
const draftReason = ref('');
const editingReason = ref('');
const faceProcessing = ref(false);
let faceTimer: ReturnType<typeof setTimeout> | null = null;
const isNeedleReturnLikeProcess = computed(() => props.type === 'exchange' || props.type === 'return');
const isReturnProcess = computed(() => props.type === 'return');
const processActionLabel = computed(() => isReturnProcess.value ? '还针' : '换针');
const reasonOptions = computed(() => isReturnProcess.value ? returnReasonOptions.value : exchangeReasonOptions.value);
const reasonPlaceholder = computed(() => `请选择${processActionLabel.value}原因`);
const reasonTitle = computed(() => `${processActionLabel.value}原因`);
const reasonMaintenanceTitle = computed(() => `${processActionLabel.value}原因维护`);
const reasonMaintenanceDescription = computed(() => `新增、修改、删除${processActionLabel.value}原因`);
const reasonInputPlaceholder = computed(() => `输入${processActionLabel.value}原因`);
const currentSlotStock = computed(() => props.selectedSlot?.count ?? 0);
const maxDispenseQuantity = computed(() => Math.max(0, currentSlotStock.value));
const isDispenseQuietStep = computed(() => (
  props.type === 'dispense'
  && ['quantity_input', 'dispensing', 'complete'].includes(props.phase)
));
const isLargeTitleStep = computed(() => simpleExchangeTitle.value || isDispenseQuietStep.value);
const canConfirmDispenseQuantity = computed(() => (
  props.type === 'dispense'
  && Boolean(props.selectedSlot)
  && props.dispenseQuantity >= 1
  && props.dispenseQuantity <= maxDispenseQuantity.value
));
const dispenseOperationOptions = [
  { label: '直接领针', icon: Inbox, primary: true },
  { label: '授权领针', icon: User },
  { label: '代领', icon: CreditCard },
  { label: '代换', icon: Wrench },
  { label: '批量换针', icon: Upload },
  { label: '代还', icon: Repeat2 },
];

const EXCHANGE_SIMPLE_TITLES: Partial<Record<ProcessPhase, string>> = {
  vision_processing: '机针识别',
  wrapping: '正在包针',
  dispensing: '正在出针',
  complete: '出针完成',
};

const simpleExchangeTitle = computed(() => {
  if (!isNeedleReturnLikeProcess.value) return '';
  if (isReturnProcess.value && props.phase === 'complete') return '还针完成';
  return EXCHANGE_SIMPLE_TITLES[props.phase] ?? '';
});

const EXCHANGE_STEP_LABELS: Partial<Record<ProcessPhase, string>> = {
  exchange_select_slot: '第三步：选择对应针位',
  exchange_face_secondary: '第四步：人脸识别',
  select_reason: '第五步：选择换针原因',
  vision_processing: '第六步：正在识别机针',
  recognition_failed: '第六步：未识别到机针',
  wrapping: '第六步：正在包针',
  dispensing: '第六步：正在出针',
  complete: '第七步：取针口取针',
};

const RETURN_STEP_LABELS: Partial<Record<ProcessPhase, string>> = {
  exchange_select_slot: '第三步：选择对应针位',
  exchange_face_secondary: '第四步：人脸识别',
  select_reason: '第五步：选择还针原因',
  vision_processing: '第六步：正在识别机针',
  recognition_failed: '第六步：未识别到机针',
  wrapping: '第六步：正在包针',
  complete: '第七步：包针完成',
};

const exchangeDisplayStep = computed(() => {
  if (!isNeedleReturnLikeProcess.value) return null;
  const map: Partial<Record<ProcessPhase, number>> = {
    exchange_select_slot: 3,
    exchange_face_secondary: 4,
    select_reason: 5,
    vision_processing: 6,
    recognition_failed: 6,
    wrapping: 6,
    dispensing: 6,
    complete: 7,
  };
  return map[props.phase] ?? null;
});

const getTitle = () => {
  if (props.type === 'dispense' && props.phase === 'quantity_input') return '领针数量';
  if (props.type === 'dispense' && props.phase === 'dispensing') return '正在出针';
  if (props.type === 'dispense' && props.phase === 'complete') return '出针完成';
  switch (props.type) {
    case 'exchange': return '换针流程';
    case 'return': return '还针流程';
    case 'dispense': return '领用机针流程';
    case 'replenish': return '库存补充';
    default: return '操作处理';
  }
};

const getStepDescription = () => {
  if (props.type === 'exchange' && EXCHANGE_STEP_LABELS[props.phase]) {
    return EXCHANGE_STEP_LABELS[props.phase]!;
  }
  if (props.type === 'return' && RETURN_STEP_LABELS[props.phase]) {
    return RETURN_STEP_LABELS[props.phase]!;
  }
  switch (props.phase) {
    case 'dispense_operation_select': return '选择操作';
    case 'dispense_ready': return '选择针位';
    case 'face_recognition': return '身份验证';
    case 'select_reason': return '原因登记';
    case 'vision_processing': return '视觉检测';
    case 'quantity_input': return '输入数量';
    case 'dispensing': return '发放处理';
    default: return '进行中';
  }
};

const addReason = () => {
  const value = draftReason.value.trim();
  if (!value || reasonOptions.value.includes(value)) return;
  if (isReturnProcess.value) {
    returnReasonOptions.value.push(value);
  } else {
    exchangeReasonOptions.value.push(value);
  }
  draftReason.value = '';
};

const startEditReason = (reason: string) => {
  editingReason.value = reason;
  draftReason.value = reason;
};

const saveReason = () => {
  const value = draftReason.value.trim();
  if (!editingReason.value || !value) return;
  if (isReturnProcess.value) {
    returnReasonOptions.value = returnReasonOptions.value.map((reason) => reason === editingReason.value ? value : reason);
  } else {
    exchangeReasonOptions.value = exchangeReasonOptions.value.map((reason) => reason === editingReason.value ? value : reason);
  }
  if (props.selectedReason === editingReason.value) {
    emit('reasonSelect', value);
  }
  editingReason.value = '';
  draftReason.value = '';
};

const deleteReason = (reason: string) => {
  if (isReturnProcess.value) {
    returnReasonOptions.value = returnReasonOptions.value.filter((item) => item !== reason);
  } else {
    exchangeReasonOptions.value = exchangeReasonOptions.value.filter((item) => item !== reason);
  }
  if (props.selectedReason === reason) {
    emit('reasonSelect', '');
  }
};

const handleReasonChange = (event: Event) => {
  emit('reasonSelect', (event.target as HTMLSelectElement).value);
};

const updateDispenseQuantity = (value: number) => {
  const max = maxDispenseQuantity.value;
  const normalized = Number.isFinite(value) ? Math.trunc(value) : 1;
  emit('dispenseQuantityChange', Math.min(Math.max(1, normalized), Math.max(1, max)));
};

const handleDispenseQuantityInput = (event: Event) => {
  updateDispenseQuantity(Number((event.target as HTMLInputElement).value));
};

const stopFaceRecognition = () => {
  faceProcessing.value = false;
  if (faceTimer) {
    clearTimeout(faceTimer);
    faceTimer = null;
  }
};

const startExchangeFaceRecognition = () => {
  if (faceProcessing.value) return;
  faceProcessing.value = true;
  if (faceTimer) {
    clearTimeout(faceTimer);
  }
  faceTimer = setTimeout(() => {
    faceProcessing.value = false;
    faceTimer = null;
    emit('next');
  }, 1800);
};

const startFaceRecognition = () => {
  if (faceProcessing.value) return;
  faceProcessing.value = true;
  if (faceTimer) {
    clearTimeout(faceTimer);
  }
  faceTimer = setTimeout(() => {
    faceProcessing.value = false;
    faceTimer = null;
    emit('next');
  }, 1800);
};

watch(() => props.phase, (newPhase) => {
  if (newPhase === 'exchange_face_secondary') {
    stopFaceRecognition();
  } else if (newPhase === 'face_recognition' && props.type === 'dispense') {
    stopFaceRecognition();
  } else if (faceTimer) {
    stopFaceRecognition();
  }
  if (newPhase === 'vision_processing') {
    setTimeout(() => {
      emit('next');
    }, 3000);
  }
  if (newPhase === 'wrapping' || newPhase === 'dispensing') {
    setTimeout(() => {
      emit('next');
    }, 3000);
  }
});

watch(() => props.type, () => {
  isReasonMaintenanceOpen.value = false;
  editingReason.value = '';
  draftReason.value = '';
});
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
      <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden p-4">
        <div @click="emit('close')" class="absolute inset-0 bg-gray-900/40 backdrop-blur-md" />
        
        <Transition
          appear
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="opacity-0 scale-90 translate-y-4"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-90 translate-y-4"
        >
          <section
            v-if="isNeedleReturnLikeProcess && phase === 'exchange_face_secondary'"
            class="login-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="exchange-face-title"
          >
            <header class="login-modal-header">
              <div class="login-heading">
                <div class="login-title-mark" />
                <div>
                  <h2 id="exchange-face-title">身份验证</h2>
                </div>
              </div>
              <button type="button" class="login-close-button" @click="emit('close')">
                <X :size="34" :stroke-width="2" />
              </button>
            </header>

            <div class="login-modal-body">
              <div class="face-login-body">
                <div :class="['face-camera-panel', faceProcessing && 'processing']" @click="startExchangeFaceRecognition">
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
                  <button type="button" class="login-alt-link">
                    <User :size="32" :stroke-width="2.2" />
                    <span>账号密码登录</span>
                  </button>
                  <button type="button" class="login-alt-link">
                    <CreditCard :size="32" :stroke-width="2.2" />
                    <span>刷卡登录</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section
            v-else-if="type === 'dispense' && phase === 'dispense_operation_select'"
            class="login-modal-card operation-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dispense-operation-title"
          >
            <header class="login-modal-header">
              <div class="login-heading">
                <div class="login-title-mark" />
                <div>
                  <h2 id="dispense-operation-title">选择操作</h2>
                </div>
              </div>
              <button type="button" class="login-close-button" @click="emit('close')">
                <X :size="34" :stroke-width="2" />
              </button>
            </header>

            <div class="login-modal-body">
              <div class="operation-grid">
                <button
                  v-for="option in dispenseOperationOptions"
                  :key="option.label"
                  type="button"
                  class="operation-card"
                  @click="option.primary && emit('next')"
                >
                  <span class="operation-icon-ring">
                    <component :is="option.icon" :size="54" :stroke-width="2.25" />
                  </span>
                  <span>{{ option.label }}</span>
                </button>
              </div>
            </div>
          </section>

          <section
            v-else-if="type === 'dispense' && phase === 'face_recognition'"
            class="login-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dispense-face-title"
          >
            <header class="login-modal-header">
              <div class="login-heading">
                <div class="login-title-mark" />
                <div>
                  <h2 id="dispense-face-title">身份验证</h2>
                </div>
              </div>
              <button type="button" class="login-close-button" @click="emit('close')">
                <X :size="34" :stroke-width="2" />
              </button>
            </header>

            <div class="login-modal-body">
              <div class="face-login-body">
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
                  <button type="button" class="login-alt-link">
                    <User :size="32" :stroke-width="2.2" />
                    <span>账号密码登录</span>
                  </button>
                  <button type="button" class="login-alt-link">
                    <CreditCard :size="32" :stroke-width="2.2" />
                    <span>刷卡登录</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section
            v-else-if="isNeedleReturnLikeProcess && phase === 'select_reason'"
            class="login-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="exchange-reason-title"
          >
            <header class="login-modal-header">
              <div class="login-heading">
                <div class="login-title-mark" />
                <div>
                  <h2 id="exchange-reason-title">{{ reasonTitle }}</h2>
                </div>
              </div>
              <button type="button" class="login-close-button" @click="emit('close')">
                <X :size="34" :stroke-width="2" />
              </button>
            </header>

            <div class="login-modal-body">
              <div class="flex flex-col gap-5 pt-7">
                <div class="flex gap-4">
                  <select
                    :value="selectedReason"
                    @change="handleReasonChange"
                    class="h-[64px] flex-1 rounded-xl border-2 border-gray-100 bg-white px-6 text-xl font-bold text-gray-700 outline-none focus:border-[var(--color-zoje-green)]"
                  >
                    <option value="" disabled>{{ reasonPlaceholder }}</option>
                    <option v-for="reason in reasonOptions" :key="reason" :value="reason">{{ reason }}</option>
                  </select>
                  <button
                    v-if="isAdmin"
                    type="button"
                    @click="isReasonMaintenanceOpen = true"
                    class="h-[64px] px-6 rounded-xl border-2 border-gray-100 bg-gray-50 text-xl font-black text-gray-700 hover:border-[var(--color-zoje-green)] hover:text-[var(--color-zoje-green)]"
                  >
                    维护原因
                  </button>
                </div>
                <button
                  type="button"
                  :disabled="!selectedReason"
                  @click="emit('next')"
                  class="h-[72px] w-full rounded-xl bg-[var(--color-zoje-green)] text-2xl text-white font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
                >
                  确认
                </button>
              </div>
            </div>

            <div v-if="isReasonMaintenanceOpen" class="absolute inset-0 z-10 bg-white flex flex-col">
              <div class="h-16 flex items-center justify-between px-6 border-b border-gray-100 bg-gray-50">
                <div>
                  <h3 class="text-lg font-black text-gray-900 leading-tight">{{ reasonMaintenanceTitle }}</h3>
                  <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{{ reasonMaintenanceDescription }}</p>
                </div>
                <button
                  type="button"
                  @click="isReasonMaintenanceOpen = false; editingReason = ''; draftReason = ''"
                  class="w-10 h-10 rounded-full hover:bg-white hover:shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all"
                >
                  <X :size="24" />
                </button>
              </div>

              <div class="p-6 flex flex-col gap-4 overflow-hidden">
                <div class="flex gap-2">
                  <input
                    v-model="draftReason"
                    type="text"
                    :placeholder="reasonInputPlaceholder"
                    class="flex-1 rounded-xl border-2 border-gray-100 bg-white px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:border-[var(--color-zoje-green)]"
                  />
                  <button
                    v-if="editingReason"
                    type="button"
                    @click="saveReason"
                    class="w-12 rounded-xl bg-[var(--color-zoje-green)] text-white flex items-center justify-center"
                  >
                    <Save :size="20" />
                  </button>
                  <button
                    v-else
                    type="button"
                    @click="addReason"
                    class="w-12 rounded-xl bg-[var(--color-zoje-green)] text-white flex items-center justify-center"
                  >
                    <Plus :size="22" />
                  </button>
                </div>

                <div class="flex-1 overflow-y-auto rounded-2xl border border-gray-100 divide-y divide-gray-100">
                  <div
                    v-for="reason in reasonOptions"
                    :key="reason"
                    class="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <span class="text-sm font-bold text-gray-700">{{ reason }}</span>
                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        @click="startEditReason(reason)"
                        class="w-9 h-9 rounded-lg bg-gray-50 text-gray-500 hover:text-[var(--color-zoje-green)] flex items-center justify-center"
                      >
                        <Pencil :size="17" />
                      </button>
                      <button
                        type="button"
                        @click="deleteReason(reason)"
                        class="w-9 h-9 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center"
                      >
                        <Trash2 :size="17" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div v-else class="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            <!-- Modal Header -->
            <div class="h-16 flex items-center justify-between px-6 border-b border-gray-100 bg-gray-50">
              <div class="flex items-center gap-3">
                <div class="w-2 h-8 bg-[var(--color-zoje-green)] rounded-full" />
                <div>
                  <h2 :class="isLargeTitleStep ? 'text-[30px] font-normal text-gray-900 leading-none' : 'text-lg font-black text-gray-900 leading-tight'">
                    {{ simpleExchangeTitle || getTitle() }}
                  </h2>
                  <p v-if="!isLargeTitleStep && !isNeedleReturnLikeProcess" class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    <template v-if="exchangeDisplayStep !== null">第 {{ exchangeDisplayStep }} / 7 步 · </template>{{ getStepDescription() }}
                  </p>
                </div>
              </div>
              <button
                @click="emit('close')"
                class="w-10 h-10 rounded-full hover:bg-white hover:shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all"
              >
                <X :size="24" />
              </button>
            </div>

            <!-- Modal Body -->
            <div class="p-8 max-h-[70vh] overflow-y-auto">
              <!-- Content segments split by phase -->

              <!-- 换针：选择对应针位 -->
              <div v-if="isNeedleReturnLikeProcess && phase === 'exchange_select_slot'" class="flex flex-col gap-4">
                <p class="text-xs font-bold text-gray-500 text-center">请点击下方针位编号，选择需要{{ processActionLabel }}的仓位</p>
                <div class="grid grid-cols-5 gap-2 max-h-[42vh] overflow-y-auto pr-1">
                  <button
                    v-for="s in slots"
                    :key="s.id"
                    type="button"
                    @click="emit('exchangeSelectSlot', s)"
                    :class="cn(
                      'py-3 rounded-xl border-2 text-sm font-black transition-all',
                      selectedSlot?.id === s.id
                        ? 'border-[var(--color-zoje-green)] bg-green-50 text-[var(--color-zoje-green)]'
                        : 'border-gray-100 bg-white text-gray-700 hover:border-[var(--color-zoje-green)]/50'
                    )"
                  >
                    #{{ s.number }}
                  </button>
                </div>
              </div>

              <!-- Face Recognition (非换针流程) -->
              <div v-else-if="phase === 'face_recognition'" class="flex flex-col items-center gap-6">
                <div class="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border-4 border-gray-100 shadow-inner group">
                  <div class="absolute inset-0 flex items-center justify-center">
                    <Camera :size="48" class="text-gray-700 animate-pulse" />
                  </div>
                  <img 
                    src="https://images.unsplash.com/photo-1544005313/94ddf0286df2?auto=format&fit=crop&q=80&w=640" 
                    class="w-full h-full object-cover opacity-60 blend-multiply"
                    alt="Camera Feed"
                  />
                  <div class="absolute inset-0 border-[var(--color-zoje-green)] border-2 m-12 rounded-lg pointer-events-none">
                    <div class="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[var(--color-zoje-green)]" />
                    <div class="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[var(--color-zoje-green)]" />
                    <div class="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[var(--color-zoje-green)]" />
                    <div class="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[var(--color-zoje-green)]" />
                  </div>
                  <div class="absolute bottom-4 left-0 right-0 text-center">
                    <span class="bg-black/50 text-white px-4 py-1.5 rounded-full text-sm font-bold backdrop-blur-sm">
                      请对准摄像头进行人脸识别
                    </span>
                  </div>
                </div>
                <div class="flex gap-4 w-full">
                  <button @click="emit('next')" class="flex-1 py-4 rounded-xl bg-[var(--color-zoje-green)] text-white font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg">
                    确认身份 (模拟)
                  </button>
                </div>
              </div>

              <!-- Select Equipment -->
              <div v-else-if="phase === 'select_equipment'" class="grid grid-cols-3 gap-4">
                <button v-for="label in ['直接领针', '授权领针', '代领', '代换', '批量换针', '代还']" :key="label" @click="emit('next')" class="flex flex-col items-center justify-center p-6 bg-white border-2 border-gray-100 rounded-2xl hover:border-[var(--color-zoje-green)] hover:shadow-lg transition-all group">
                  <div class="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <component :is="label === '代还' ? Inbox : label.includes('领') ? Download : User" :size="32" class="text-green-600" />
                  </div>
                  <span class="text-xs font-black text-gray-700 tracking-tight">{{ label }}</span>
                </button>
              </div>

              <!-- Quantity Input -->
              <div v-else-if="phase === 'quantity_input'" class="flex flex-col gap-6 py-2">
                <div class="rounded-2xl border border-gray-100 bg-gray-50 px-6 py-5">
                  <div class="flex items-center justify-between gap-5">
                    <div>
                      <div class="text-xs font-black text-gray-400 uppercase tracking-wider">当前针位</div>
                      <div class="mt-2 text-3xl font-black text-[var(--color-zoje-green)]">#{{ selectedSlot?.number ?? '--' }}</div>
                    </div>
                    <div class="text-right">
                      <div class="text-xs font-black text-gray-400 uppercase tracking-wider">当前库存</div>
                      <div class="mt-2 text-4xl font-black text-gray-900">{{ currentSlotStock }}</div>
                    </div>
                  </div>
                  <div class="mt-4 text-sm font-bold text-gray-500">
                    {{ selectedSlot?.needleType || selectedSlot?.needleName || '机针' }} {{ selectedSlot?.needleNo || selectedSlot?.model || '' }}
                  </div>
                </div>

                <div class="flex flex-col items-center gap-4">
                  <label class="text-xl font-black text-gray-800">领针数量</label>
                  <div class="flex items-center gap-5">
                    <button
                      type="button"
                      :disabled="dispenseQuantity <= 1"
                      @click="updateDispenseQuantity(dispenseQuantity - 1)"
                      class="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-4xl font-bold text-gray-500 hover:bg-gray-200 active:scale-90 transition-all disabled:cursor-not-allowed disabled:text-gray-300 disabled:bg-gray-50"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      :min="1"
                      :max="maxDispenseQuantity"
                      :value="dispenseQuantity"
                      @input="handleDispenseQuantityInput"
                      class="w-36 h-24 rounded-2xl border-4 border-[var(--color-zoje-green)] bg-green-50/20 text-center text-5xl font-black text-gray-800 outline-none shadow-inner"
                    />
                    <button
                      type="button"
                      :disabled="dispenseQuantity >= maxDispenseQuantity"
                      @click="updateDispenseQuantity(dispenseQuantity + 1)"
                      class="w-16 h-16 rounded-2xl bg-[var(--color-zoje-green)] flex items-center justify-center text-4xl font-bold text-white hover:brightness-110 active:scale-90 transition-all shadow-md disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
                    >
                      +
                    </button>
                  </div>
                  <p v-if="maxDispenseQuantity === 0" class="text-sm font-bold text-red-500">当前针位库存为 0，不能领针</p>
                </div>

                <div class="grid grid-cols-2 gap-4 w-full mt-2">
                  <button @click="emit('close')" class="py-4 rounded-xl bg-gray-100 text-gray-500 font-bold hover:bg-gray-200 transition-all">
                    返回
                  </button>
                  <button
                    :disabled="!canConfirmDispenseQuantity"
                    @click="emit('next')"
                    class="flex-1 py-4 rounded-xl bg-[var(--color-zoje-green)] text-white font-black shadow-lg hover:brightness-105 active:scale-[0.98] transition-all disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
                  >
                    确认
                  </button>
                </div>
              </div>

              <!-- Select Reason -->
              <div v-else-if="phase === 'select_reason'" class="flex flex-col gap-4">
                <label class="text-xs font-bold text-gray-500">{{ reasonTitle }}</label>
                <div class="flex gap-3">
                  <select
                    :value="selectedReason"
                    @change="handleReasonChange"
                    class="flex-1 rounded-xl border-2 border-gray-100 bg-white px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:border-[var(--color-zoje-green)]"
                  >
                    <option value="" disabled>{{ reasonPlaceholder }}</option>
                    <option v-for="reason in reasonOptions" :key="reason" :value="reason">{{ reason }}</option>
                  </select>
                  <button
                    v-if="isNeedleReturnLikeProcess && isAdmin"
                    type="button"
                    @click="isReasonMaintenanceOpen = true"
                    class="px-4 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm font-black text-gray-700 hover:border-[var(--color-zoje-green)] hover:text-[var(--color-zoje-green)]"
                  >
                    维护原因
                  </button>
                </div>
                <button
                  type="button"
                  :disabled="isNeedleReturnLikeProcess && !selectedReason"
                  @click="emit('next')"
                  class="w-full py-4 rounded-xl bg-[var(--color-zoje-green)] text-white font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
                >
                  确认原因
                </button>
              </div>

              <!-- Vision Processing -->
              <div v-else-if="phase === 'vision_processing'" class="flex flex-col items-center gap-8 py-8">
                <div class="relative w-48 h-48">
                  <div class="absolute inset-0 rounded-full border-4 border-gray-100" />
                  <div class="absolute inset-0 rounded-full border-4 border-transparent border-t-[var(--color-zoje-green)] animate-spin" />
                  <div class="absolute inset-0 flex items-center justify-center">
                    <Loader2 :size="48" class="text-[var(--color-zoje-green)] animate-spin" />
                  </div>
                </div>
                <div class="flex flex-col items-center gap-2">
                  <h3 class="text-xl font-black text-gray-800">正在识别机针</h3>
                  <p v-if="!isNeedleReturnLikeProcess" class="text-gray-500 font-medium">请保持机针位于回收口识别区域</p>
                </div>
              </div>

              <!-- Recognition Failed -->
              <div v-else-if="phase === 'recognition_failed'" class="flex flex-col items-center gap-6 py-8">
                <div class="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                  <AlertTriangle :size="42" />
                </div>
                <div class="text-center">
                  <h3 class="text-2xl font-black text-gray-800">未识别到机针</h3>
                  <p v-if="!isNeedleReturnLikeProcess" class="text-gray-500 mt-2 leading-relaxed">
                    请将机针放入回收口，放入机针后再重新从第三步（选择针位）开始操作。
                  </p>
                </div>
                <button @click="emit('restartExchangeFromSlot')" class="w-full py-4 rounded-xl bg-[var(--color-zoje-green)] text-white font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg">
                  返回选择针位
                </button>
              </div>

              <!-- Wrapping -->
              <div v-else-if="phase === 'wrapping'" class="flex flex-col items-center gap-8 py-12">
                <div class="relative w-36 h-36">
                  <div class="absolute inset-0 rounded-full border-4 border-gray-100" />
                  <div class="absolute inset-0 rounded-full border-4 border-transparent border-t-[var(--color-zoje-green)] animate-spin" />
                  <div class="absolute inset-0 flex items-center justify-center">
                    <Loader2 :size="44" class="text-[var(--color-zoje-green)] animate-spin" />
                  </div>
                </div>
                <div class="flex flex-col items-center gap-2">
                  <h3 class="text-2xl font-black text-gray-800">正在包针</h3>
                </div>
              </div>

              <!-- Dispensing -->
              <div v-else-if="phase === 'dispensing'" class="flex flex-col items-center gap-8 py-12">
                <div class="relative w-36 h-36">
                  <div class="absolute inset-0 rounded-full border-4 border-gray-100" />
                  <div class="absolute inset-0 rounded-full border-4 border-transparent border-t-[var(--color-zoje-green)] animate-spin" />
                  <div class="absolute inset-0 flex items-center justify-center">
                    <Loader2 :size="44" class="text-[var(--color-zoje-green)] animate-spin" />
                  </div>
                </div>
                <div class="flex flex-col items-center gap-2">
                  <h3 class="text-2xl font-black text-gray-800">{{ type === 'return' ? '正在包针' : '正在出针' }}</h3>
                  <p v-if="type !== 'exchange'" class="text-gray-500 font-medium text-center px-2">
                    {{ type === 'dispense' ? '系统正在按领针数量出针' : '请从取针口领取新机针' }}
                  </p>
                </div>
                <div class="w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-4">
                  <div class="h-full bg-green-500 animate-loading-bar" />
                </div>
              </div>

              <!-- Complete -->
              <div v-else-if="phase === 'complete'" class="flex flex-col items-center gap-6 py-8">
                <div class="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle2 :size="40" />
                </div>
                <div class="text-center">
                  <h3 class="text-2xl font-black text-gray-800">
                    {{ type === 'exchange' || type === 'dispense' ? '请从取针口取针' : type === 'return' ? '还针完成' : '操作成功' }}
                  </h3>
                  <p v-if="!isNeedleReturnLikeProcess" class="text-gray-500 mt-2">
                    {{ type === 'dispense' ? '出针完成，当前针位库存已更新。' : type === 'return' ? '还针已完成。' : '库存已更新，请关闭弹窗' }}
                  </p>
                </div>
                <button
                  @click="isNeedleReturnLikeProcess ? emit('restartExchangeFromSlot') : emit('close')"
                  class="w-full py-4 rounded-xl bg-gray-900 text-white font-bold hover:bg-black transition-all shadow-lg mt-4"
                >
                  {{ isNeedleReturnLikeProcess ? '确认' : '确认并关闭' }}
                </button>
              </div>

            </div>

            <!-- Modal Footer Info -->
            <div v-if="!isLargeTitleStep && !isNeedleReturnLikeProcess" class="bg-green-50 px-8 py-3 flex items-center gap-2 border-t border-green-100">
              <Info :size="14" class="text-[var(--color-zoje-green)]" />
              <span class="text-[10px] font-bold text-[var(--color-zoje-green)] uppercase tracking-wide">
                系统将根据传感器与视觉模块实时反馈自动执行下一步
              </span>
            </div>

            <div v-if="isReasonMaintenanceOpen" class="absolute inset-0 z-10 bg-white flex flex-col">
              <div class="h-16 flex items-center justify-between px-6 border-b border-gray-100 bg-gray-50">
                <div>
                  <h3 class="text-lg font-black text-gray-900 leading-tight">{{ reasonMaintenanceTitle }}</h3>
                  <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{{ reasonMaintenanceDescription }}</p>
                </div>
                <button
                  type="button"
                  @click="isReasonMaintenanceOpen = false; editingReason = ''; draftReason = ''"
                  class="w-10 h-10 rounded-full hover:bg-white hover:shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all"
                >
                  <X :size="24" />
                </button>
              </div>

              <div class="p-6 flex flex-col gap-4 overflow-hidden">
                <div class="flex gap-2">
                  <input
                    v-model="draftReason"
                    type="text"
                    :placeholder="reasonInputPlaceholder"
                    class="flex-1 rounded-xl border-2 border-gray-100 bg-white px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:border-[var(--color-zoje-green)]"
                  />
                  <button
                    v-if="editingReason"
                    type="button"
                    @click="saveReason"
                    class="w-12 rounded-xl bg-[var(--color-zoje-green)] text-white flex items-center justify-center"
                  >
                    <Save :size="20" />
                  </button>
                  <button
                    v-else
                    type="button"
                    @click="addReason"
                    class="w-12 rounded-xl bg-[var(--color-zoje-green)] text-white flex items-center justify-center"
                  >
                    <Plus :size="22" />
                  </button>
                </div>

                <div class="flex-1 overflow-y-auto rounded-2xl border border-gray-100 divide-y divide-gray-100">
                  <div
                    v-for="reason in reasonOptions"
                    :key="reason"
                    class="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <span class="text-sm font-bold text-gray-700">{{ reason }}</span>
                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        @click="startEditReason(reason)"
                        class="w-9 h-9 rounded-lg bg-gray-50 text-gray-500 hover:text-[var(--color-zoje-green)] flex items-center justify-center"
                      >
                        <Pencil :size="17" />
                      </button>
                      <button
                        type="button"
                        @click="deleteReason(reason)"
                        class="w-9 h-9 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center"
                      >
                        <Trash2 :size="17" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
@keyframes loading-bar {
  0% { width: 0; }
  100% { width: 100%; }
}
.animate-loading-bar {
  animation: loading-bar 3s forwards linear;
}
</style>
