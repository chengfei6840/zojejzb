<script setup lang="ts">
import { computed, watch } from 'vue';
import { X, Camera, CheckCircle2, Loader2, Info, Download, User, RotateCw, Inbox, ArrowDownToLine, MousePointerClick } from 'lucide-vue-next';
import type { NeedleSlot, ProcessPhase } from '../types';
import { EXCHANGE_REASONS, RETURN_REASONS } from '../constants';
import { cn } from '../lib/utils';

interface Props {
  phase: ProcessPhase;
  type: 'exchange' | 'return' | 'dispense' | 'replenish' | 'clear' | null;
  selectedSlot?: NeedleSlot | null;
  slots?: NeedleSlot[];
}

const props = withDefaults(defineProps<Props>(), {
  selectedSlot: null,
  slots: () => [],
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'next'): void;
  (e: 'exchangeSelectSlot', slot: NeedleSlot): void;
}>();

const isOpen = computed(() => props.phase !== 'idle');

const EXCHANGE_STEP_LABELS: Partial<Record<ProcessPhase, string>> = {
  exchange_put_needle: '第一步：把针放到还针口',
  exchange_click_action: '第二步：点击换针功能',
  exchange_face_primary: '第三步：摄像头人脸识别',
  exchange_select_slot: '第四步：选择对应针位',
  exchange_face_secondary: '第五步：人脸识别',
  select_reason: '第六步：选择换针原因',
  vision_processing: '第七步：机器识别机针 / 出新针（设备内部处理）',
  dispensing: '第七步：机器识别机针 / 出新针（设备内部处理）',
  complete: '第八步：取针口取针',
};

/** 换针流程对外展示为 8 步（第 7 步含视觉识别与设备出针） */
const exchangeDisplayStep = computed(() => {
  if (props.type !== 'exchange') return null;
  const map: Partial<Record<ProcessPhase, number>> = {
    exchange_put_needle: 1,
    exchange_click_action: 2,
    exchange_face_primary: 3,
    exchange_select_slot: 4,
    exchange_face_secondary: 5,
    select_reason: 6,
    vision_processing: 7,
    dispensing: 7,
    complete: 8,
  };
  return map[props.phase] ?? null;
});

const getTitle = () => {
  switch (props.type) {
    case 'exchange': return '换针流程';
    case 'return': return '机针还回流程';
    case 'dispense': return '领用机针流程';
    case 'replenish': return '库存补充';
    default: return '操作处理';
  }
};

const getStepDescription = () => {
  if (props.type === 'exchange' && EXCHANGE_STEP_LABELS[props.phase]) {
    return EXCHANGE_STEP_LABELS[props.phase]!;
  }
  switch (props.phase) {
    case 'face_recognition': return '身份验证';
    case 'select_reason': return '原因登记';
    case 'vision_processing': return '视觉检测';
    case 'quantity_input': return '输入数量';
    case 'dispensing': return '发放处理';
    default: return '进行中';
  }
};

const reasons = computed(() => props.type === 'exchange' ? EXCHANGE_REASONS : RETURN_REASONS);

// Handle dispensing completion (auto-next after delay in original)
watch(() => props.phase, (newPhase) => {
  if (newPhase === 'dispensing') {
    setTimeout(() => {
      emit('next');
    }, 3000);
  }
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
          <div class="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            <!-- Modal Header -->
            <div class="h-16 flex items-center justify-between px-6 border-b border-gray-100 bg-gray-50">
              <div class="flex items-center gap-3">
                <div class="w-2 h-8 bg-[var(--color-zoje-green)] rounded-full" />
                <div>
                  <h2 class="text-lg font-black text-gray-900 leading-tight">{{ getTitle() }}</h2>
                  <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    <template v-if="exchangeDisplayStep !== null">第 {{ exchangeDisplayStep }} / 8 步 · </template>{{ getStepDescription() }}
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

              <!-- 换针：第一步 把针放到还针口 -->
              <div v-if="type === 'exchange' && phase === 'exchange_put_needle'" class="flex flex-col items-center gap-6">
                <div class="w-full rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 flex flex-col items-center gap-4">
                  <div class="w-16 h-16 rounded-full bg-white border border-gray-100 flex items-center justify-center text-[var(--color-zoje-green)] shadow-inner">
                    <ArrowDownToLine :size="32" />
                  </div>
                  <p class="text-center text-sm font-bold text-gray-700 leading-relaxed">
                    请先将待更换的旧针放入<strong class="text-[var(--color-zoje-green)]">还针口</strong>，放置到位后再继续。
                  </p>
                </div>
                <button type="button" @click="emit('next')" class="w-full py-4 rounded-xl bg-[var(--color-zoje-green)] text-white font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg">
                  已放好，下一步
                </button>
              </div>

              <!-- 换针：第二步 点击换针功能 -->
              <div v-else-if="type === 'exchange' && phase === 'exchange_click_action'" class="flex flex-col items-center gap-6">
                <div class="w-full rounded-2xl border-2 border-gray-100 bg-white p-8 flex flex-col items-center gap-4 shadow-inner">
                  <div class="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center text-[var(--color-zoje-green)]">
                    <MousePointerClick :size="32" />
                  </div>
                  <p class="text-center text-sm font-bold text-gray-700 leading-relaxed">
                    请在首页顶部点击<strong class="text-[var(--color-zoje-green)]">「换针」</strong>进入本流程（您已打开本窗口即表示已触发，可直接继续）。
                  </p>
                </div>
                <button type="button" @click="emit('next')" class="w-full py-4 rounded-xl bg-[var(--color-zoje-green)] text-white font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg">
                  继续
                </button>
              </div>

              <!-- 换针：第三步 摄像头人脸识别 -->
              <div v-else-if="type === 'exchange' && phase === 'exchange_face_primary'" class="flex flex-col items-center gap-6">
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
                      第三步：请对准摄像头进行人脸识别
                    </span>
                  </div>
                </div>
                <button type="button" @click="emit('next')" class="w-full py-4 rounded-xl bg-[var(--color-zoje-green)] text-white font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg">
                  识别通过（模拟）
                </button>
              </div>

              <!-- 换针：第四步 选择对应针位 -->
              <div v-else-if="type === 'exchange' && phase === 'exchange_select_slot'" class="flex flex-col gap-4">
                <p class="text-xs font-bold text-gray-500 text-center">请点击下方针位编号，选择需要换针的仓位</p>
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

              <!-- 换针：第五步 人脸识别 -->
              <div v-else-if="type === 'exchange' && phase === 'exchange_face_secondary'" class="flex flex-col items-center gap-6">
                <div class="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border-4 border-gray-100 shadow-inner group">
                  <div class="absolute inset-0 flex items-center justify-center">
                    <Camera :size="48" class="text-gray-700 animate-pulse" />
                  </div>
                  <img 
                    src="https://images.unsplash.com/photo-1544005313/94ddf0286df2?auto=format&fit=crop&q=80&w=640" 
                    class="w-full h-full object-cover opacity-60 blend-multiply"
                    alt="Camera Feed"
                  />
                  <div class="absolute bottom-4 left-0 right-0 text-center">
                    <span class="bg-black/50 text-white px-4 py-1.5 rounded-full text-sm font-bold backdrop-blur-sm">
                      第五步：再次人脸识别确认
                    </span>
                  </div>
                </div>
                <button type="button" @click="emit('next')" class="w-full py-4 rounded-xl bg-[var(--color-zoje-green)] text-white font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg">
                  确认通过（模拟）
                </button>
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
              <div v-else-if="phase === 'quantity_input'" class="flex flex-col items-center gap-8 py-4">
                <div class="text-center">
                  <span class="text-sm font-bold text-gray-400 uppercase tracking-widest">当前仓位库存: 14</span>
                  <div class="flex items-center gap-8 mt-6">
                    <button class="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl font-bold text-gray-400 hover:bg-gray-200 active:scale-90 transition-all">-</button>
                    <div class="w-32 h-24 border-4 border-[var(--color-zoje-green)] rounded-2xl flex items-center justify-center bg-green-50/20 shadow-inner">
                      <span class="text-5xl font-black text-gray-800">1</span>
                    </div>
                    <button class="w-16 h-16 rounded-2xl bg-[var(--color-zoje-green)] flex items-center justify-center text-3xl font-bold text-white hover:brightness-110 active:scale-90 transition-all shadow-md">+</button>
                  </div>
                </div>
                <div class="flex gap-4 w-full mt-4">
                  <button @click="emit('next')" class="flex-1 py-4 rounded-xl bg-[var(--color-zoje-green)] text-white font-black shadow-lg hover:brightness-105 active:scale-[0.98] transition-all">
                    {{ type === 'replenish' ? '确认补充' : '确认领用' }}
                  </button>
                  <button @click="emit('close')" class="px-8 py-4 rounded-xl bg-gray-100 text-gray-500 font-bold hover:bg-gray-200 transition-all">再想想</button>
                </div>
              </div>

              <!-- Select Reason -->
              <div v-else-if="phase === 'select_reason'" class="flex flex-col gap-4">
                <div class="grid grid-cols-2 gap-3">
                  <button v-for="reason in reasons" :key="reason" type="button" @click="emit('next')" class="p-6 rounded-xl border-2 border-gray-100 hover:border-[var(--color-zoje-green)] hover:bg-green-50 transition-all text-center font-bold text-gray-700">
                    {{ reason }}
                  </button>
                </div>
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
                  <h3 class="text-xl font-black text-gray-800">视觉识别中...</h3>
                  <p class="text-gray-500 font-medium">正在检测机针完整度与型号</p>
                </div>
                <button @click="emit('next')" class="mt-4 px-8 py-3 rounded-full bg-gray-100 text-gray-700 font-bold hover:bg-gray-200">
                  识别完成 (模拟)
                </button>
              </div>

              <!-- Dispensing -->
              <div v-else-if="phase === 'dispensing'" class="flex flex-col items-center gap-8 py-12">
                <div class="w-32 h-32 bg-green-50 rounded-full flex items-center justify-center text-green-500 animate-bounce">
                  <CheckCircle2 :size="64" />
                </div>
                <div class="flex flex-col items-center gap-2">
                  <h3 class="text-2xl font-black text-gray-800">{{ type === 'exchange' ? '设备内部处理中' : '系统发针中' }}</h3>
                  <p class="text-gray-500 font-medium text-center px-2">
                    {{ type === 'exchange' ? '机器识别机针并出新针，请稍候；完成后请到取针口取针。' : '请从取针口领取新机针' }}
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
                  <h3 class="text-2xl font-black text-gray-800">{{ type === 'exchange' ? '请从取针口取针' : '操作成功' }}</h3>
                  <p class="text-gray-500 mt-2">
                    {{ type === 'exchange' ? '第八步：新机针已备妥，请在取针口领取；库存将同步更新。' : '库存已更新，请关闭弹窗' }}
                  </p>
                </div>
                <button @click="emit('close')" class="w-full py-4 rounded-xl bg-gray-900 text-white font-bold hover:bg-black transition-all shadow-lg mt-4">
                  确认并关闭
                </button>
              </div>

            </div>

            <!-- Modal Footer Info -->
            <div class="bg-green-50 px-8 py-3 flex items-center gap-2 border-t border-green-100">
              <Info :size="14" class="text-[var(--color-zoje-green)]" />
              <span class="text-[10px] font-bold text-[var(--color-zoje-green)] uppercase tracking-wide">
                系统将根据传感器与视觉模块实时反馈自动执行下一步
              </span>
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
