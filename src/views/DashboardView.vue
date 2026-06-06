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
  X,
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
import { EXCHANGE_REASONS, MOCK_SLOTS, RETURN_REASONS } from '../constants';
import { messages, normalizeSupportedLocale } from '../i18n';
import type { AppView, NeedleSlot, ProcessPhase } from '../types';
import type { LanguageCode } from '../i18n';
import { cn } from '../lib/utils';

interface ExchangeReportRow {
  id: string;
  time: string;
  user: string;
  slotNumber: string;
  needleModel: string;
  quantity: number;
  reason: string;
  status: 'COMPLETED';
}

const currentView = ref<AppView>('dashboard');
const language = ref<LanguageCode>('zh-CN');
type ProcessType = 'exchange' | 'return' | 'dispense' | null;
type DispenseMode = 'direct' | 'authorized' | 'proxy' | 'proxyExchange' | 'batchExchange' | 'proxyReturn' | null;

const activeProcess = ref<{type: ProcessType, phase: ProcessPhase}>({ type: 'exchange', phase: 'exchange_select_slot' });
const slots = ref<NeedleSlot[]>(MOCK_SLOTS.map((slot) => ({ ...slot })));
const selectedSlot = ref<NeedleSlot | null>(null);
const selectedExchangeReason = ref('');
const selectedReturnReason = ref('');
const recognitionFailureTitle = ref('机针识别失败');
const recognitionFailureMessage = ref('和所选针位的机针不匹配。');
const dispenseQuantity = ref(1);
const dispenseMode = ref<DispenseMode>(null);
const authorizationUserDisplay = ref('');
const selectedReport = ref<'exchange' | 'replenish' | 'dispense' | 'return' | 'spare'>('exchange');
const isLoginOpen = ref(false);
const pendingProtectedView = ref<AppView | null>(null);
const managementModal = ref<AppView | null>(null);
const exchangeCompleted = ref(false);
const returnCompleted = ref(false);
const exchangeReports = ref<ExchangeReportRow[]>([
  { id: 'exchange-1', time: '2026-04-24 10:30:45', user: '管理员', slotNumber: '02', needleModel: 'DBx1HS 90/14#', quantity: 1, reason: '断针', status: 'COMPLETED' },
  { id: 'exchange-2', time: '2026-04-24 10:28:12', user: '管理员', slotNumber: '05', needleModel: 'DBx1HS 90/14#', quantity: 1, reason: '弯曲', status: 'COMPLETED' },
]);
const returnReports = ref<ExchangeReportRow[]>([
  { id: 'return-1', time: '2026-04-24 10:45:10', user: '管理员', slotNumber: '03', needleModel: 'DBx1HS 90/14#', quantity: 1, reason: '订单结束', status: 'COMPLETED' },
  { id: 'return-2', time: '2026-04-24 10:40:28', user: '管理员', slotNumber: '07', needleModel: 'DBx1HS 90/14#', quantity: 1, reason: '领用冗余', status: 'COMPLETED' },
]);
const locale = computed(() => normalizeSupportedLocale(language.value));
const t = computed(() => messages[locale.value]);

const stats = computed(() => ({
  total: slots.value.length,
  available: slots.value.filter((slot) => slot.count > 9).length,
  low: slots.value.filter((slot) => slot.count > 0 && slot.count <= 9).length,
  empty: slots.value.filter((slot) => slot.count === 0).length,
}));

const visibleSlots = computed(() => slots.value.slice(0, 12));
const dispenseFaceTitle = computed(() => {
  if (activeProcess.value.type !== 'dispense') return '身份验证';
  if (activeProcess.value.phase === 'dispense_authorized_face') return '被授权人身份验证';
  if (dispenseMode.value === 'authorized') return '授权人身份验证';
  if (dispenseMode.value === 'proxy') return '代领人身份验证';
  if (dispenseMode.value === 'proxyExchange') return '代换人身份验证';
  if (dispenseMode.value === 'batchExchange') return '批量换针身份验证';
  if (dispenseMode.value === 'proxyReturn') return '代还人身份验证';
  return '身份验证';
});
const proxyUserSelectTitle = computed(() => (
  dispenseMode.value === 'proxyExchange'
    ? '选择代换用户'
    : dispenseMode.value === 'proxyReturn'
      ? '选择代还用户'
      : '选择代领用户'
));
const isNeedleReturnLikeProcess = computed(() => activeProcess.value.type === 'exchange' || activeProcess.value.type === 'return');
const isNeedleReturnLikeSlotSelection = computed(() => (
  currentView.value === 'dashboard'
  && isNeedleReturnLikeProcess.value
  && activeProcess.value.phase === 'exchange_select_slot'
));

const resetNeedleReturnLikeSelection = (type: 'exchange' | 'return' = 'exchange') => {
  selectedSlot.value = null;
  selectedExchangeReason.value = '';
  selectedReturnReason.value = '';
  exchangeCompleted.value = false;
  returnCompleted.value = false;
  activeProcess.value = { type, phase: 'exchange_select_slot' };
};

const managementSections = computed(() => [
  {
    title: t.value.management.dataMaintenance,
    items: [
      { label: t.value.management.needleManagement, icon: LayoutGrid, view: 'needle' as AppView },
      { label: t.value.management.needlePositionManagement, icon: ArchiveRestore, view: 'needlePosition' as AppView },
      { label: t.value.management.organizationManagement, icon: UsersRound, view: 'organization' as AppView },
      { label: t.value.management.roleManagement, icon: UserCog, view: 'role' as AppView },
      { label: t.value.management.userManagement, icon: UserCheck, view: 'user' as AppView },
    ],
  },
  {
    title: t.value.management.deviceDebugging,
    items: [
      { label: t.value.management.componentStatus, icon: FileCog, active: true },
      { label: t.value.management.faceRecognition, icon: ScanFace },
      { label: t.value.management.needleRecognition, icon: ScanLine },
      { label: t.value.management.needleBoxDebugging, icon: PackageOpen },
      { label: t.value.management.controllerDebugging, icon: SlidersHorizontal },
      { label: t.value.management.mediaSettings, icon: CirclePlay },
      { label: t.value.management.languageSettings, icon: Globe2 },
      { label: t.value.management.basicParameterSettings, icon: FileCog },
      { label: t.value.management.printSettings, icon: Printer },
      { label: t.value.management.loginSettings, icon: User },
      { label: t.value.management.fragmentLossHandling, icon: AlertTriangle },
      { label: t.value.management.exchangeTimeSettings, icon: RotateCw },
    ],
  },
  {
    title: t.value.management.other,
    items: [
      { label: t.value.management.about, icon: Info },
      { label: t.value.management.exitSystem, icon: LogOut, danger: true },
    ],
  },
]);

const reportTabs = computed(() => [
  { id: 'exchange', label: t.value.reporting.exchangeReport },
  { id: 'replenish', label: t.value.reporting.replenishReport },
  { id: 'dispense', label: t.value.reporting.dispenseReport },
  { id: 'return', label: t.value.reporting.returnReport },
  { id: 'spare', label: t.value.reporting.spareReport },
]);

const EXCHANGE_PHASE_ORDER: ProcessPhase[] = [
  'exchange_select_slot',
  'exchange_face_secondary',
  'select_reason',
  'vision_processing',
  'wrapping',
  'dispensing',
  'complete',
];

const RETURN_PHASE_ORDER: ProcessPhase[] = [
  'exchange_select_slot',
  'exchange_face_secondary',
  'select_reason',
  'vision_processing',
  'wrapping',
  'complete',
];

const updateSlotStatus = (count: number): NeedleSlot['status'] => {
  if (count === 0) return 'empty';
  if (count <= 9) return 'low';
  return 'available';
};

const normalizeNeedleField = (value?: string) => (value ?? '').trim().toLowerCase();

const identifyNeedleForSelectedSlot = () => {
  if (!selectedSlot.value) return null;

  return {
    needleType: selectedSlot.value.needleType,
    needleNo: selectedSlot.value.needleNo,
    needleTip: selectedSlot.value.needleTip,
  };
};

const isRecognizedNeedleMatchedSelectedSlot = () => {
  if (!selectedSlot.value) return false;

  const recognizedNeedle = identifyNeedleForSelectedSlot();
  if (!recognizedNeedle) return false;

  return (
    normalizeNeedleField(recognizedNeedle.needleType) === normalizeNeedleField(selectedSlot.value.needleType)
    && normalizeNeedleField(recognizedNeedle.needleNo) === normalizeNeedleField(selectedSlot.value.needleNo)
    && normalizeNeedleField(recognizedNeedle.needleTip) === normalizeNeedleField(selectedSlot.value.needleTip)
  );
};

const failNeedleRecognitionMismatch = () => {
  recognitionFailureTitle.value = '机针识别失败';
  recognitionFailureMessage.value = '和所选针位的机针不匹配。';
  activeProcess.value = { ...activeProcess.value, phase: 'recognition_failed' };
};

const isNeedleRecognitionMatchRequired = () => (
  activeProcess.value.phase === 'vision_processing'
  && (
    activeProcess.value.type === 'exchange'
    || activeProcess.value.type === 'return'
    || (
      activeProcess.value.type === 'dispense'
      && ['proxyExchange', 'proxyReturn', 'batchExchange'].includes(dispenseMode.value ?? '')
    )
  )
);

const resetDispenseSelection = () => {
  selectedSlot.value = null;
  dispenseQuantity.value = 1;
};

const resetDispenseSession = () => {
  resetDispenseSelection();
  selectedExchangeReason.value = '';
  selectedReturnReason.value = '';
  dispenseMode.value = null;
  authorizationUserDisplay.value = '';
};

const formatDateTime = (date: Date) => {
  const pad = (value: number) => value.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const completeExchange = () => {
  if (!selectedSlot.value || exchangeCompleted.value) return;

  const nextSlots = slots.value.map((slot) => {
    if (slot.id !== selectedSlot.value?.id) return slot;
    const nextCount = Math.max(0, slot.count - 1);
    return {
      ...slot,
      count: nextCount,
      status: updateSlotStatus(nextCount),
    };
  });
  slots.value = nextSlots;

  const completedSlot = nextSlots.find((slot) => slot.id === selectedSlot.value?.id);
  exchangeReports.value.unshift({
    id: `exchange-${Date.now()}`,
    time: formatDateTime(new Date()),
    user: '管理员',
    slotNumber: completedSlot?.number ?? selectedSlot.value.number,
    needleModel: `${completedSlot?.needleType ?? selectedSlot.value.needleType ?? ''} ${completedSlot?.needleNo ?? selectedSlot.value.needleNo ?? ''}`.trim(),
    quantity: 1,
    reason: selectedExchangeReason.value || '其他',
    status: 'COMPLETED',
  });
  exchangeCompleted.value = true;
};

const completeBatchExchange = () => {
  if (!selectedSlot.value) return;

  const nextSlots = slots.value.map((slot) => {
    if (slot.id !== selectedSlot.value?.id) return slot;
    const nextCount = Math.max(0, slot.count - 1);
    return {
      ...slot,
      count: nextCount,
      status: updateSlotStatus(nextCount),
    };
  });
  slots.value = nextSlots;

  const completedSlot = nextSlots.find((slot) => slot.id === selectedSlot.value?.id);
  exchangeReports.value.unshift({
    id: `batch-exchange-${Date.now()}`,
    time: formatDateTime(new Date()),
    user: '管理员',
    slotNumber: completedSlot?.number ?? selectedSlot.value.number,
    needleModel: `${completedSlot?.needleType ?? selectedSlot.value.needleType ?? ''} ${completedSlot?.needleNo ?? selectedSlot.value.needleNo ?? ''}`.trim(),
    quantity: 1,
    reason: selectedExchangeReason.value || '其他',
    status: 'COMPLETED',
  });
};

const completeReturn = () => {
  if (!selectedSlot.value || returnCompleted.value) return;

  returnReports.value.unshift({
    id: `return-${Date.now()}`,
    time: formatDateTime(new Date()),
    user: '管理员',
    slotNumber: selectedSlot.value.number,
    needleModel: `${selectedSlot.value.needleType ?? ''} ${selectedSlot.value.needleNo ?? ''}`.trim(),
    quantity: 1,
    reason: selectedReturnReason.value || '其他',
    status: 'COMPLETED',
  });
  returnCompleted.value = true;
};

const completeDispense = () => {
  if (!selectedSlot.value) return;

  const quantity = Math.min(Math.max(1, dispenseQuantity.value), selectedSlot.value.count);
  slots.value = slots.value.map((slot) => {
    if (slot.id !== selectedSlot.value?.id) return slot;
    const nextCount = Math.max(0, slot.count - quantity);
    return {
      ...slot,
      count: nextCount,
      status: updateSlotStatus(nextCount),
    };
  });
};

const handleAction = (type: string) => {
  if (type === 'replenish' || type === 'clear') {
    activeProcess.value = { type: null, phase: 'idle' };
    selectedSlot.value = null;
    return;
  }
  if (type === 'exchange' || type === 'return') {
    resetNeedleReturnLikeSelection(type);
    return;
  }
  if (type === 'dispense') {
    resetDispenseSession();
    activeProcess.value = { type: 'dispense', phase: 'dispense_operation_select' };
    return;
  }
  activeProcess.value = { type: type as ProcessType, phase: 'face_recognition' };
};

const handleNextPhase = () => {
  const { type, phase } = activeProcess.value;

  if (isNeedleRecognitionMatchRequired() && !isRecognizedNeedleMatchedSelectedSlot()) {
    failNeedleRecognitionMismatch();
    return;
  }

  if (type === 'exchange' || type === 'return') {
    const phaseOrder = type === 'exchange' ? EXCHANGE_PHASE_ORDER : RETURN_PHASE_ORDER;
    const idx = phaseOrder.indexOf(phase);
    if (idx >= 0 && idx < phaseOrder.length - 1) {
      if (phase === 'dispensing') {
        completeExchange();
      }
      if (type === 'return' && phase === 'wrapping') {
        completeReturn();
      }
      activeProcess.value = { ...activeProcess.value, phase: phaseOrder[idx + 1] };
    }
    return;
  }

  if (type === 'dispense') {
    if (phase === 'dispense_operation_select') {
      activeProcess.value = { type, phase: 'face_recognition' };
      return;
    }
    if (phase === 'face_recognition') {
      activeProcess.value = { type, phase: 'dispense_ready' };
      return;
    }
    if (phase === 'dispense_authorized_face') {
      authorizationUserDisplay.value = '授权人名称 -> 被授权人名称';
      activeProcess.value = { type, phase: 'quantity_input' };
      return;
    }
    if (phase === 'batch_exchange_place_needle') {
      activeProcess.value = { type, phase: 'vision_processing' };
      return;
    }
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
    if (dispenseMode.value === 'batchExchange') {
      const batchExchangePhases: ProcessPhase[] = [
        'select_reason',
        'vision_processing',
        'wrapping',
        'dispensing',
        'batch_exchange_continue',
      ];
      const batchExchangeIdx = batchExchangePhases.indexOf(phase);
      if (batchExchangeIdx >= 0 && batchExchangeIdx < batchExchangePhases.length - 1) {
        if (phase === 'dispensing') {
          completeBatchExchange();
        }
        activeProcess.value = { ...activeProcess.value, phase: batchExchangePhases[batchExchangeIdx + 1] };
        return;
      }
    }
    if (dispenseMode.value === 'proxyExchange' || dispenseMode.value === 'proxyReturn') {
      const proxyNeedlePhases: ProcessPhase[] = dispenseMode.value === 'proxyReturn'
        ? [
            'select_reason',
            'vision_processing',
            'wrapping',
            'complete',
          ]
        : [
            'select_reason',
            'vision_processing',
            'wrapping',
            'dispensing',
            'complete',
          ];
      const proxyNeedleIdx = proxyNeedlePhases.indexOf(phase);
      if (proxyNeedleIdx >= 0 && proxyNeedleIdx < proxyNeedlePhases.length - 1) {
        if (phase === 'dispensing') {
          completeExchange();
        }
        if (dispenseMode.value === 'proxyReturn' && phase === 'wrapping') {
          completeReturn();
        }
        activeProcess.value = { ...activeProcess.value, phase: proxyNeedlePhases[proxyNeedleIdx + 1] };
        return;
      }
    }
    if (phase === 'quantity_input') {
      nextIdx = phases.indexOf('dispensing');
    }
    if (phase === 'dispensing') {
      completeDispense();
    }
  }

  if (nextIdx < phases.length) {
    activeProcess.value = { ...activeProcess.value, phase: phases[nextIdx] };
  }
};

const applyViewChange = (view: AppView) => {
  currentView.value = view;
  managementModal.value = null;
  if (view === 'dashboard') {
    resetNeedleReturnLikeSelection();
    return;
  }
  activeProcess.value = { type: null, phase: 'idle' };
  selectedSlot.value = null;
  selectedExchangeReason.value = '';
  selectedReturnReason.value = '';
  dispenseQuantity.value = 1;
  dispenseMode.value = null;
  authorizationUserDisplay.value = '';
  exchangeCompleted.value = false;
  returnCompleted.value = false;
};

const onViewChange = (view: AppView) => {
  if (view === 'reporting' || view === 'management') {
    pendingProtectedView.value = view;
    isLoginOpen.value = true;
    return;
  }

  applyViewChange(view);
};

const onSlotClick = (slot: NeedleSlot) => {
  if (currentView.value === 'dashboard' && activeProcess.value.type === 'dispense' && activeProcess.value.phase === 'dispense_ready') {
    selectedSlot.value = slot;
    dispenseQuantity.value = slot.count > 0 ? 1 : 0;
    activeProcess.value = {
      type: 'dispense',
      phase: dispenseMode.value === 'authorized'
        ? 'dispense_authorized_face'
        : dispenseMode.value === 'proxy'
          ? 'dispense_proxy_user_select'
          : dispenseMode.value === 'proxyExchange'
            ? 'dispense_proxy_user_select'
            : dispenseMode.value === 'batchExchange'
              ? 'select_reason'
            : dispenseMode.value === 'proxyReturn'
              ? 'dispense_proxy_user_select'
              : 'quantity_input',
    };
    return;
  }
  if (isNeedleReturnLikeSlotSelection.value) {
    selectedSlot.value = slot;
    activeProcess.value = { type: activeProcess.value.type, phase: 'exchange_face_secondary' };
    return;
  }
  selectedSlot.value = slot;
};

const onNeedleReturnLikeSelectSlot = (slot: NeedleSlot) => {
  selectedSlot.value = slot;
  handleNextPhase();
};

const selectedProcessReason = computed(() => {
  if (activeProcess.value.type === 'return') return selectedReturnReason.value;
  if (activeProcess.value.type === 'dispense' && dispenseMode.value === 'proxyReturn') return selectedReturnReason.value;
  return selectedExchangeReason.value;
});

const onProcessReasonSelect = (reason: string) => {
  if (activeProcess.value.type === 'return' || (activeProcess.value.type === 'dispense' && dispenseMode.value === 'proxyReturn')) {
    selectedReturnReason.value = reason;
    return;
  }
  selectedExchangeReason.value = reason;
};

const onDispenseOperationSelect = (operation: 'direct' | 'authorized' | 'proxy' | 'proxyExchange' | 'batchExchange' | 'proxyReturn') => {
  resetDispenseSelection();
  selectedExchangeReason.value = '';
  selectedReturnReason.value = '';
  exchangeCompleted.value = false;
  returnCompleted.value = false;
  authorizationUserDisplay.value = '';
  dispenseMode.value = operation;
  activeProcess.value = { type: 'dispense', phase: 'face_recognition' };
};

const onProxyUserConfirm = () => {
  if (dispenseMode.value === 'proxyExchange') {
    exchangeCompleted.value = false;
    selectedExchangeReason.value = '';
  }
  if (dispenseMode.value === 'proxyReturn') {
    returnCompleted.value = false;
    selectedReturnReason.value = '';
  }
  activeProcess.value = {
    type: 'dispense',
    phase: dispenseMode.value === 'proxyExchange' || dispenseMode.value === 'proxyReturn' ? 'select_reason' : 'quantity_input',
  };
};

const onBatchExchangeContinue = (shouldContinue: boolean) => {
  activeProcess.value = {
    type: 'dispense',
    phase: shouldContinue ? 'batch_exchange_place_needle' : 'complete',
  };
};

const onExchangeRecognitionFailed = () => {
  selectedSlot.value = null;
  selectedExchangeReason.value = '';
  selectedReturnReason.value = '';
  activeProcess.value = { type: activeProcess.value.type, phase: 'recognition_failed' };
};

const restartExchangeFromSlot = () => {
  resetNeedleReturnLikeSelection(activeProcess.value.type === 'return' ? 'return' : 'exchange');
};

const closeProcess = () => {
  if (currentView.value === 'dashboard' && isNeedleReturnLikeProcess.value) {
    resetNeedleReturnLikeSelection(activeProcess.value.type === 'return' ? 'return' : 'exchange');
    return;
  }
  if (currentView.value === 'dashboard' && activeProcess.value.type === 'dispense') {
    const shouldReturnToDispensePage = [
      'dispense_authorized_face',
      'dispense_proxy_user_select',
      'select_reason',
      'vision_processing',
      'wrapping',
      'batch_exchange_continue',
      'batch_exchange_place_needle',
      'quantity_input',
      'dispensing',
      'complete',
    ].includes(activeProcess.value.phase);
    resetDispenseSelection();
    activeProcess.value = { type: 'dispense', phase: shouldReturnToDispensePage ? 'dispense_ready' : 'idle' };
    return;
  }
  activeProcess.value = { type: null, phase: 'idle' };
  selectedSlot.value = null;
  selectedExchangeReason.value = '';
  selectedReturnReason.value = '';
  dispenseQuantity.value = 1;
  dispenseMode.value = null;
  authorizationUserDisplay.value = '';
  exchangeCompleted.value = false;
  returnCompleted.value = false;
};

const closeLogin = () => {
  isLoginOpen.value = false;
  pendingProtectedView.value = null;
};

const completeProtectedViewLogin = () => {
  const targetView = pendingProtectedView.value;
  closeLogin();

  if (targetView) {
    applyViewChange(targetView);
  }
};

const onSystemItemClick = (item: { view?: AppView }) => {
  if (item.view) {
    managementModal.value = item.view;
  }
};

const closeManagementModal = () => {
  managementModal.value = null;
};
</script>

<template>
  <div class="h-screen w-screen flex flex-col bg-gray-50 overflow-hidden">
    <Header 
      :current-view="currentView" 
      :active-action="activeProcess.type"
      :language="language"
      @view-change="onViewChange" 
      @action="handleAction"
      @language-change="language = $event"
    />

    <main class="flex-1 overflow-hidden scrollbar-hide">
      <!-- Dashboard View -->
      <div v-if="currentView === 'dashboard'" class="dashboard-shell">
        <!-- Stats Bar -->
        <div class="stats-grid">
          <div class="stat-card">
            <Home :size="43" :stroke-width="2.1" class="stat-icon green" />
            <div class="stat-copy">
              <div class="stat-title">{{ t.dashboard.totalSlots }}</div>
            </div>
            <span class="stat-number green">{{ stats.total }}</span>
          </div>

          <div class="stat-card">
            <List :size="43" :stroke-width="2.1" class="stat-icon green" />
            <div class="stat-copy">
              <div class="stat-title">{{ t.dashboard.available }}</div>
              <div class="stat-subtitle">{{ t.dashboard.availableSubtitle }}</div>
            </div>
            <span class="stat-number green">{{ stats.available }}</span>
          </div>

          <div class="stat-card">
            <CircleAlert :size="48" :stroke-width="2.1" class="stat-icon amber" />
            <div class="stat-copy">
              <div class="stat-title">{{ t.dashboard.lowStock }}</div>
              <div class="stat-subtitle">{{ t.dashboard.lowStockSubtitle }}</div>
            </div>
            <span class="stat-number amber">{{ stats.low }}</span>
          </div>

          <div class="stat-card">
            <CircleAlert :size="48" :stroke-width="2.1" class="stat-icon red" />
            <div class="stat-copy">
              <div class="stat-title">{{ t.dashboard.outOfStock }}</div>
              <div class="stat-subtitle">{{ t.dashboard.outOfStockSubtitle }}</div>
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
            :selected="!isNeedleReturnLikeSlotSelection && selectedSlot?.id === slot.id"
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

      <!-- Reporting View -->
      <div v-else-if="currentView === 'reporting'" class="h-full overflow-y-auto max-w-[1800px] mx-auto py-2 pb-1 pr-2">
        <div class="flex items-center justify-between gap-2 mb-2 bg-white p-1 rounded-lg shadow-sm border border-gray-100">
          <div class="flex items-center gap-2">
            <button 
              v-for="tab in reportTabs"
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
              <option>{{ t.reporting.allRecords }}</option>
              <option>{{ t.reporting.weekRecords }}</option>
              <option>{{ t.reporting.monthRecords }}</option>
            </select>
            <button class="bg-[var(--color-zoje-green)] text-white px-4 py-1 rounded-md text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-md">
              {{ t.reporting.exportExcel }}
            </button>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-50/50 text-[10px] text-gray-400 font-black uppercase tracking-widest border-b border-gray-100">
                  <th class="px-6 py-3">{{ t.reporting.time }}</th>
                  <th class="px-6 py-3">{{ t.reporting.operator }}</th>
                  <th class="px-6 py-3">{{ t.reporting.slotOrAttribute }}</th>
                  <th class="px-6 py-3">
                    {{ selectedReport === 'exchange' ? t.reporting.needleModel : t.reporting.targetContent }}
                  </th>
                  <th class="px-6 py-3">
                    {{ 
                      selectedReport === 'replenish' ? t.reporting.replenishQuantity : 
                      selectedReport === 'dispense' ? t.reporting.dispenseQuantity :
                      selectedReport === 'return' ? t.reporting.returnQuantity : t.reporting.quantity 
                    }}
                  </th>
                  <th class="px-6 py-3">{{ t.reporting.reasonOrSource }}</th>
                  <th class="px-6 py-3 text-right">{{ t.reporting.status }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="i in selectedReport === 'exchange' ? exchangeReports : selectedReport === 'return' ? returnReports : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]"
                  :key="typeof i === 'number' ? i : i.id"
                  class="border-b border-gray-50 hover:bg-green-50/20 transition-colors"
                >
                  <td class="px-6 py-3 text-sm font-medium text-gray-500">
                    {{ typeof i === 'number' ? `2026-04-24 10:30:${i}2` : i.time }}
                  </td>
                  <td class="px-6 py-3 text-sm font-bold text-gray-800">
                    {{ typeof i === 'number' ? t.reporting.admin : i.user }}
                  </td>
                  <td class="px-6 py-3 text-sm font-mono text-[var(--color-zoje-green)] font-black">
                    {{ typeof i === 'number' ? (selectedReport === 'spare' ? t.reporting.spareWarehouse : `#${i.toString().padStart(2, '0')}`) : `#${i.slotNumber}` }}
                  </td>
                  <td class="px-6 py-3 text-sm font-bold text-gray-700">
                    {{ typeof i === 'number' ? 'DB×1HS 90/14#' : i.needleModel }}
                  </td>
                  <td class="px-6 py-3 text-sm font-black text-gray-800">
                    {{ typeof i === 'number' ? 1 : i.quantity }}
                  </td>
                  <td class="px-6 py-3 text-sm font-medium text-gray-400">
                    {{ 
                      typeof i !== 'number' ? i.reason :
                      selectedReport === 'exchange' ? EXCHANGE_REASONS[i % EXCHANGE_REASONS.length] : 
                      selectedReport === 'replenish' ? t.reporting.purchaseStockIn :
                      selectedReport === 'dispense' ? t.reporting.productionUse :
                      selectedReport === 'return' ? RETURN_REASONS[i % RETURN_REASONS.length] : t.reporting.outbound
                    }}
                  </td>
                  <td class="px-6 py-3 text-right">
                    <span class="text-[10px] font-bold px-3 py-1.5 bg-green-50 text-green-600 rounded-lg border border-green-100">{{ t.reporting.completed }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="p-2.5 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
            <span class="text-xs text-gray-400 font-bold uppercase tracking-wider">{{ t.reporting.showRecords }}</span>
            <div class="flex items-center gap-2">
              <button class="w-8 h-8 rounded-lg border-2 border-gray-100 flex items-center justify-center text-gray-400 font-bold hover:bg-white hover:border-[var(--color-zoje-green)] hover:text-[var(--color-zoje-green)] transition-all">1</button>
              <button class="w-8 h-8 rounded-lg border-2 border-gray-100 flex items-center justify-center text-gray-400 font-bold hover:bg-white hover:border-[var(--color-zoje-green)] hover:text-[var(--color-zoje-green)] transition-all">2</button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <div v-if="managementModal" class="management-modal-layer">
      <section class="management-modal-card">
        <button type="button" class="management-modal-close" @click="closeManagementModal">
          <X :size="32" :stroke-width="2.2" />
        </button>
        <div class="management-modal-body">
          <OrganizationManagement v-if="managementModal === 'organization'" />
          <NeedleManagement v-else-if="managementModal === 'needle'" />
          <NeedlePositionManagement v-else-if="managementModal === 'needlePosition'" />
          <RoleManagement v-else-if="managementModal === 'role'" />
          <UserManagement v-else-if="managementModal === 'user'" />
        </div>
      </section>
    </div>

    <ProcessModal 
      :phase="activeProcess.phase" 
      :type="activeProcess.type" 
      :selected-slot="selectedSlot"
      :selected-reason="selectedProcessReason"
      :recognition-failure-title="recognitionFailureTitle"
      :recognition-failure-message="recognitionFailureMessage"
      :dispense-quantity="dispenseQuantity"
      :dispense-face-title="dispenseFaceTitle"
      :proxy-user-select-title="proxyUserSelectTitle"
      :is-proxy-exchange="dispenseMode === 'proxyExchange'"
      :is-batch-exchange="dispenseMode === 'batchExchange'"
      :is-proxy-return="dispenseMode === 'proxyReturn'"
      :slots="slots"
      :is-admin="true"
      @close="closeProcess"
      @next="handleNextPhase"
      @exchange-select-slot="onNeedleReturnLikeSelectSlot"
      @reason-select="onProcessReasonSelect"
      @dispense-quantity-change="dispenseQuantity = $event"
      @dispense-operation-select="onDispenseOperationSelect"
      @proxy-user-confirm="onProxyUserConfirm"
      @batch-exchange-continue="onBatchExchangeContinue"
      @recognition-failed="onExchangeRecognitionFailed"
      @restart-exchange-from-slot="restartExchangeFromSlot"
    />

    <LoginModal
      :open="isLoginOpen"
      initial-mode="face"
      :language="language"
      @close="closeLogin"
      @login="completeProtectedViewLogin"
    />
  </div>
</template>
