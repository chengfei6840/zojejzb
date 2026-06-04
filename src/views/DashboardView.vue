<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  AlertTriangle,
  ArchiveRestore,
  BarChart3,
  Boxes,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CircleAlert,
  CirclePlay,
  FileCog,
  Globe2,
  Home,
  Info,
  LayoutGrid,
  List,
  LogOut,
  PackageOpen,
  Printer,
  RotateCw,
  ScanFace,
  ScanLine,
  Settings,
  SlidersHorizontal,
  User,
  UserCheck,
  UserCog,
  UsersRound,
} from 'lucide-vue-next';
import Header from '../components/Header.vue';
import SlotCard from '../components/SlotCard.vue';
import ProcessModal from '../components/ProcessModal.vue';
import LoginModal from '../components/LoginModal.vue';
import NeedleManagement from '../components/NeedleManagement.vue';
import NeedlePositionManagement from '../components/NeedlePositionManagement.vue';
import OrganizationManagement from '../components/OrganizationManagement.vue';
import RoleManagement from '../components/RoleManagement.vue';
import UserManagement from '../components/UserManagement.vue';
import { EXCHANGE_REASONS, MOCK_SLOTS } from '../constants';
import type { AppView, NeedleSlot, ProcessPhase } from '../types';
import { cn } from '../lib/utils';

const currentView = ref<AppView>('dashboard');
const activeProcess = ref<{type: any, phase: ProcessPhase}>({ type: null, phase: 'idle' });
const selectedSlot = ref<NeedleSlot | null>(null);
const selectedReport = ref<'exchange' | 'replenish' | 'dispense' | 'return' | 'spare'>('exchange');
const isLoginOpen = ref(false);

const stats = computed(() => ({
  total: 30,
  available: 22,
  low: 6,
  empty: 2,
}));

const visibleSlots = computed(() => MOCK_SLOTS.slice(0, 12));

const managementSections = [
  {
    title: '数据维护',
    items: [
      { label: '机针管理', icon: LayoutGrid, view: 'needle' as AppView },
      { label: '针位管理', icon: ArchiveRestore, view: 'needlePosition' as AppView },
      { label: '组织管理', icon: UsersRound, view: 'organization' as AppView },
      { label: '角色管理', icon: UserCog, view: 'role' as AppView },
      { label: '用户管理', icon: UserCheck, view: 'user' as AppView },
    ],
  },
  {
    title: '设备调试',
    items: [
      { label: '部件状态', icon: FileCog, active: true },
      { label: '人脸识别', icon: ScanFace },
      { label: '机针识别', icon: ScanLine },
      { label: '针盒调试', icon: PackageOpen },
      { label: '控制器调试', icon: SlidersHorizontal },
      { label: '媒体设置', icon: CirclePlay },
      { label: '语言设置', icon: Globe2 },
      { label: '基础参数设置', icon: FileCog },
      { label: '打印设置', icon: Printer },
      { label: '登陆设置', icon: User },
      { label: '异常针碎片丢失处理', icon: AlertTriangle },
      { label: '换针时间设置', icon: RotateCw },
    ],
  },
  {
    title: '其他',
    items: [
      { label: '关于', icon: Info },
      { label: '退出系统', icon: LogOut, danger: true },
    ],
  },
];

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

const closeLogin = () => {
  isLoginOpen.value = false;
};

const onSystemItemClick = (item: { view?: AppView }) => {
  if (item.view) {
    currentView.value = item.view;
  }
};
</script>

<template>
  <div class="h-screen w-screen flex flex-col bg-gray-50 overflow-hidden">
    <Header 
      :current-view="currentView" 
      @view-change="onViewChange" 
      @action="handleAction"
      @login="isLoginOpen = true"
    />

    <main class="flex-1 overflow-hidden scrollbar-hide">
      <!-- Dashboard View -->
      <div v-if="currentView === 'dashboard'" class="dashboard-shell">
        <!-- Stats Bar -->
        <div class="stats-grid">
          <div class="stat-card">
            <Home :size="43" :stroke-width="2.1" class="stat-icon green" />
            <div class="stat-copy">
              <div class="stat-title">总仓位</div>
            </div>
            <span class="stat-number green">{{ stats.total }}</span>
          </div>

          <div class="stat-card">
            <List :size="43" :stroke-width="2.1" class="stat-icon green" />
            <div class="stat-copy">
              <div class="stat-title">充足</div>
              <div class="stat-subtitle">库存充足（＞10）</div>
            </div>
            <span class="stat-number green">{{ stats.available }}</span>
          </div>

          <div class="stat-card">
            <CircleAlert :size="48" :stroke-width="2.1" class="stat-icon amber" />
            <div class="stat-copy">
              <div class="stat-title">低库存</div>
              <div class="stat-subtitle">库存不足（1-9）</div>
            </div>
            <span class="stat-number amber">{{ stats.low }}</span>
          </div>

          <div class="stat-card">
            <CircleAlert :size="48" :stroke-width="2.1" class="stat-icon red" />
            <div class="stat-copy">
              <div class="stat-title">缺货</div>
              <div class="stat-subtitle">库存为0</div>
            </div>
            <span class="stat-number red">{{ stats.empty }}</span>
          </div>
        </div>

        <!-- Grid -->
        <div class="slot-grid">
          <SlotCard 
            v-for="slot in visibleSlots" 
            :key="slot.id" 
            :slot="slot" 
            @click="onSlotClick" 
          />
        </div>

        <div class="pager">
          <button class="pager-btn muted"><ChevronsLeft :size="31" :stroke-width="1.7" /></button>
          <button class="pager-btn muted"><ChevronLeft :size="31" :stroke-width="1.7" /></button>
          <button class="pager-page active">1</button>
          <button class="pager-page">2</button>
          <button class="pager-page">3</button>
          <button class="pager-btn muted"><ChevronRight :size="31" :stroke-width="1.7" /></button>
          <button class="pager-btn muted"><ChevronsRight :size="31" :stroke-width="1.7" /></button>
        </div>
      </div>

      <!-- Management View -->
      <div v-else-if="currentView === 'management'" class="system-page">
        <section v-for="section in managementSections" :key="section.title" class="system-section">
          <div class="system-section-title">
            <span></span>
            <h2>{{ section.title }}</h2>
          </div>
          <div class="system-card-grid">
            <button
              v-for="item in section.items"
              :key="item.label"
              @click="onSystemItemClick(item)"
              :class="cn('system-card', item.active && 'active', item.danger && 'danger')"
            >
              <div class="system-icon-ring">
                <component :is="item.icon" :size="56" :stroke-width="2.4" />
              </div>
              <div class="system-card-label">{{ item.label }}</div>
            </button>
          </div>
        </section>
      </div>

      <OrganizationManagement
        v-else-if="currentView === 'organization'"
        @back="currentView = 'management'"
      />

      <NeedleManagement
        v-else-if="currentView === 'needle'"
        @back="currentView = 'management'"
      />

      <NeedlePositionManagement
        v-else-if="currentView === 'needlePosition'"
        @back="currentView = 'management'"
      />

      <RoleManagement
        v-else-if="currentView === 'role'"
        @back="currentView = 'management'"
      />

      <UserManagement
        v-else-if="currentView === 'user'"
        @back="currentView = 'management'"
      />

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

    <LoginModal
      :open="isLoginOpen"
      @close="closeLogin"
      @login="closeLogin"
    />
  </div>
</template>
