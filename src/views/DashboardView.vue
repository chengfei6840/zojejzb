<script setup lang="ts">
import { ref, computed } from 'vue';
import { LayoutGrid, AlertTriangle, CheckCircle2, BarChart3, User, Search, RotateCw, Settings, Info, LogOut, Inbox } from 'lucide-vue-next';
import Header from '../components/Header.vue';
import SlotCard from '../components/SlotCard.vue';
import ProcessModal from '../components/ProcessModal.vue';
import { EXCHANGE_REASONS, MOCK_SLOTS } from '../constants';
import type { AppView, NeedleSlot, ProcessPhase } from '../types';
import { cn } from '../lib/utils';

const currentView = ref<AppView>('dashboard');
const activeProcess = ref<{type: any, phase: ProcessPhase}>({ type: null, phase: 'idle' });
const selectedSlot = ref<NeedleSlot | null>(null);
const selectedReport = ref<'exchange' | 'replenish' | 'dispense' | 'return' | 'spare'>('exchange');

const stats = computed(() => ({
  total: MOCK_SLOTS.length,
  available: MOCK_SLOTS.filter(s => s.status === 'available').length,
  low: MOCK_SLOTS.filter(s => s.status === 'low').length,
  empty: MOCK_SLOTS.filter(s => s.status === 'empty').length,
}));

const EXCHANGE_PHASE_ORDER: ProcessPhase[] = [
  'exchange_put_needle',
  'exchange_click_action',
  'exchange_face_primary',
  'exchange_select_slot',
  'exchange_face_secondary',
  'select_reason',
  'vision_processing',
  'dispensing',
  'complete',
];

const handleAction = (type: string) => {
  if (type === 'exchange') {
    activeProcess.value = { type, phase: 'exchange_put_needle' };
    return;
  }
  activeProcess.value = { type, phase: 'face_recognition' };
};

const handleNextPhase = () => {
  const { type, phase } = activeProcess.value;

  if (type === 'exchange') {
    const idx = EXCHANGE_PHASE_ORDER.indexOf(phase);
    if (idx >= 0 && idx < EXCHANGE_PHASE_ORDER.length - 1) {
      activeProcess.value = { ...activeProcess.value, phase: EXCHANGE_PHASE_ORDER[idx + 1] };
    }
    return;
  }

  const phases: ProcessPhase[] = [
    'face_recognition', 
    'select_equipment',
    'select_reason', 
    'vision_processing', 
    'quantity_input',
    'dispensing', 
    'complete'
  ];
  
  let currentIdx = phases.indexOf(phase);
  let nextIdx = currentIdx + 1;
  
  if (type === 'dispense') {
    if (phase === 'select_equipment') {
      nextIdx = phases.indexOf('quantity_input');
    }
  }

  if (type === 'replenish') {
     if (phase === 'face_recognition') {
       nextIdx = phases.indexOf('quantity_input');
     }
  }

  if (nextIdx < phases.length) {
    activeProcess.value = { ...activeProcess.value, phase: phases[nextIdx] };
  }
};

const onViewChange = (view: AppView) => {
  currentView.value = view;
};

const onSlotClick = (slot: NeedleSlot) => {
  selectedSlot.value = slot;
};

const onExchangeSelectSlot = (slot: NeedleSlot) => {
  selectedSlot.value = slot;
  handleNextPhase();
};

const closeProcess = () => {
  activeProcess.value = { type: null, phase: 'idle' };
};
</script>

<template>
  <div class="h-screen w-screen flex flex-col bg-gray-50 overflow-hidden">
    <Header 
      :current-view="currentView" 
      @view-change="onViewChange" 
      @action="handleAction"
    />

    <main class="flex-1 overflow-hidden p-2.5 scrollbar-hide">
      <!-- Dashboard View -->
      <div v-if="currentView === 'dashboard'" class="h-full max-w-[1800px] mx-auto flex flex-col gap-2">
        <!-- Stats Bar -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2 flex-shrink-0">
          <div :class="cn('px-4 py-2 rounded-xl bg-[var(--color-zoje-green)] text-white border border-[var(--color-zoje-green)] industrial-shadow flex items-center justify-between')">
            <div class="flex items-center gap-2">
              <div class="p-1.5 rounded-lg bg-white/15 text-white">
                <LayoutGrid :size="14" />
              </div>
              <span class="text-[12px] font-bold tracking-wide">总仓位</span>
            </div>
            <span class="text-xl font-black">{{ stats.total }}</span>
          </div>

          <div class="px-4 py-2 rounded-xl bg-white border border-gray-100 industrial-shadow flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="p-1.5 rounded-lg bg-gray-50 text-green-600">
                <CheckCircle2 :size="14" />
              </div>
              <span class="text-[12px] font-bold text-gray-600">充足</span>
            </div>
            <span class="text-xl font-black text-green-600">{{ stats.available }}</span>
          </div>

          <div class="px-4 py-2 rounded-xl bg-white border border-gray-100 industrial-shadow flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="p-1.5 rounded-lg bg-gray-50 text-amber-500">
                <AlertTriangle :size="14" />
              </div>
              <span class="text-[12px] font-bold text-gray-600">低库存</span>
            </div>
            <span class="text-xl font-black text-amber-500">{{ stats.low }}</span>
          </div>

          <div class="px-4 py-2 rounded-xl bg-white border border-gray-100 industrial-shadow flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="p-1.5 rounded-lg bg-gray-50 text-red-500">
                <AlertTriangle :size="14" />
              </div>
              <span class="text-[12px] font-bold text-gray-600">缺货</span>
            </div>
            <span class="text-xl font-black text-red-500">{{ stats.empty }}</span>
          </div>
        </div>

        <!-- Grid -->
        <div class="flex-1 grid grid-cols-6 grid-rows-5 gap-2 min-h-0 pb-0">
          <SlotCard 
            v-for="slot in MOCK_SLOTS" 
            :key="slot.id" 
            :slot="slot" 
            @click="onSlotClick" 
          />
        </div>
      </div>

      <!-- Management View -->
      <div v-else-if="currentView === 'management'" class="h-full overflow-hidden max-w-[1800px] mx-auto py-2">
        <div class="grid grid-cols-1 gap-3 h-full">
          <section v-for="section in [
            { title: '数据维护', items: [
              { label: '机针管理', icon: LayoutGrid },
              { label: '针位管理', icon: Inbox },
              { label: '组织管理', icon: User },
              { label: '角色管理', icon: Settings },
              { label: '用户管理', icon: User }
            ]},
            { title: '设备调试', items: [
              { label: '部件状态', icon: BarChart3 },
              { label: '人脸识别', icon: User },
              { label: '机针识别', icon: Search },
              { label: '针盒调试', icon: RotateCw },
              { label: '控制器调试', icon: Settings },
              { label: '媒体设置', icon: Inbox },
              { label: '语言设置', icon: Settings },
              { label: '基础参数设置', icon: Settings },
              { label: '打印设置', icon: Settings },
              { label: '登录设置', icon: Settings },
              { label: '异常针碎片丢失处理', icon: AlertTriangle },
              { label: '换针时间设置', icon: RotateCw }
            ]},
            { title: '其他', items: [
              { label: '关于', icon: Info },
              { label: '退出系统', icon: LogOut, color: 'text-red-600' }
            ]}
          ]" :key="section.title">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-1.5 h-6 bg-[var(--color-zoje-green)] rounded-full" />
              <h2 class="text-xl font-black text-gray-800">{{ section.title }}</h2>
            </div>
            <div class="grid grid-cols-5 xl:grid-cols-6 gap-2">
              <button v-for="item in section.items" :key="item.label" class="flex flex-col items-center justify-center p-3 bg-white border border-gray-100 rounded-xl industrial-shadow hover:border-[var(--color-zoje-green)] hover:-translate-y-0.5 transition-all group min-h-24">
                <div :class="cn('w-11 h-11 rounded-full bg-gray-50 flex items-center justify-center mb-2 group-hover:bg-green-50 transition-colors shadow-inner', item.color || 'text-[var(--color-zoje-green)]')">
                  <component :is="item.icon" :size="22" />
                </div>
                <span class="text-xs font-black text-gray-700 tracking-tight text-center leading-tight">{{ item.label }}</span>
              </button>
            </div>
          </section>
        </div>
      </div>

      <!-- Reporting View -->
      <div v-else-if="currentView === 'reporting'" class="h-full overflow-y-auto max-w-[1800px] mx-auto py-2 pb-1 pr-2">
        <div class="flex items-center justify-between gap-2 mb-2 bg-white p-1 rounded-lg shadow-sm border border-gray-100">
          <div class="flex items-center gap-2">
            <button 
              v-for="tab in [
                { id: 'exchange', label: '换针报表' },
                { id: 'replenish', label: '补针报表' },
                { id: 'dispense', label: '领针报表' },
                { id: 'return', label: '还针报表' },
                { id: 'spare', label: '备用仓报表' }
              ]"
              :key="tab.id"
              @click="selectedReport = tab.id as any"
              :class="cn(
                'px-5 py-1.5 rounded-md text-sm font-black transition-all',
                selectedReport === tab.id 
                  ? 'bg-[var(--color-zoje-green)] text-white shadow-lg shadow-green-200' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              )"
            >
              {{ tab.label }}
            </button>
          </div>
          <div class="flex items-center gap-2">
            <select class="bg-white border-2 border-gray-100 rounded-md px-2.5 py-1 text-xs font-bold text-gray-600 outline-none focus:border-[var(--color-zoje-green)] transition-all">
              <option>全部记录</option>
              <option>本周记录</option>
              <option>本月记录</option>
            </select>
            <button class="bg-[var(--color-zoje-green)] text-white px-4 py-1 rounded-md text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-md">
              导出 Excel
            </button>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-50/50 text-[10px] text-gray-400 font-black uppercase tracking-widest border-b border-gray-100">
                  <th class="px-6 py-3">时间</th>
                  <th class="px-6 py-3">操作人</th>
                  <th class="px-6 py-3">针位/属性</th>
                  <th class="px-6 py-3">
                    {{ selectedReport === 'exchange' ? '机针型号' : '针对内容' }}
                  </th>
                  <th class="px-6 py-3">
                    {{ 
                      selectedReport === 'replenish' ? '补针数量' : 
                      selectedReport === 'dispense' ? '领针数量' :
                      selectedReport === 'return' ? '回收数量' : '数量' 
                    }}
                  </th>
                  <th class="px-6 py-3">原因/来源</th>
                  <th class="px-6 py-3 text-right">状态</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="i in [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]" :key="i" class="border-b border-gray-50 hover:bg-green-50/20 transition-colors">
                  <td class="px-6 py-3 text-sm font-medium text-gray-500">2026-04-24 10:30:{{i}}2</td>
                  <td class="px-6 py-3 text-sm font-bold text-gray-800">管理员</td>
                  <td class="px-6 py-3 text-sm font-mono text-[var(--color-zoje-green)] font-black">
                    {{ selectedReport === 'spare' ? '备用仓' : `#${i.toString().padStart(2, '0')}` }}
                  </td>
                  <td class="px-6 py-3 text-sm font-bold text-gray-700">DB×1HS 90/14#</td>
                  <td class="px-6 py-3 text-sm font-black text-gray-800">1</td>
                  <td class="px-6 py-3 text-sm font-medium text-gray-400">
                    {{ 
                      selectedReport === 'exchange' ? EXCHANGE_REASONS[i % EXCHANGE_REASONS.length] : 
                      selectedReport === 'replenish' ? '外购进库' :
                      selectedReport === 'dispense' ? '生产领用' :
                      selectedReport === 'return' ? '订单结束' : '出库' 
                    }}
                  </td>
                  <td class="px-6 py-3 text-right">
                    <span class="text-[10px] font-bold px-3 py-1.5 bg-green-50 text-green-600 rounded-lg border border-green-100">COMPLETED</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="p-2.5 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
            <span class="text-xs text-gray-400 font-bold uppercase tracking-wider">Show 10 of 24 records</span>
            <div class="flex items-center gap-2">
              <button class="w-8 h-8 rounded-lg border-2 border-gray-100 flex items-center justify-center text-gray-400 font-bold hover:bg-white hover:border-[var(--color-zoje-green)] hover:text-[var(--color-zoje-green)] transition-all">1</button>
              <button class="w-8 h-8 rounded-lg border-2 border-gray-100 flex items-center justify-center text-gray-400 font-bold hover:bg-white hover:border-[var(--color-zoje-green)] hover:text-[var(--color-zoje-green)] transition-all">2</button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <ProcessModal 
      :phase="activeProcess.phase" 
      :type="activeProcess.type" 
      :selected-slot="selectedSlot"
      :slots="MOCK_SLOTS"
      @close="closeProcess"
      @next="handleNextPhase"
      @exchange-select-slot="onExchangeSelectSlot"
    />
  </div>
</template>
