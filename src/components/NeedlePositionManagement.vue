<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { Check, Download, Pencil, RotateCcw, Search, Trash2, Upload, X } from 'lucide-vue-next';
import type { NeedlePositionRecord } from '../types';

type NeedleOption = {
  id: string;
  name: string;
  model: string;
  needleTip: string;
  needleNo: string;
  brand: string;
};

const needleOptions: NeedleOption[] = [
  { id: 'needle-db-90', name: 'A8100平车', model: 'DBx1HS', needleTip: 'R/SET', needleNo: '90/14#', brand: '格罗茨' },
  { id: 'needle-dc-75', name: '包缝机针', model: 'DCx27', needleTip: '圆尖', needleNo: '75/11#', brand: '风琴' },
  { id: 'needle-dp-110', name: '厚料机针', model: 'DPx5', needleTip: '尖头', needleNo: '110/18#', brand: '蓝狮' },
  { id: 'needle-db-75', name: '薄料平车针', model: 'DBx1', needleTip: '尖圆头', needleNo: '75/11#', brand: '风琴' },
];

const defaultMotionSettings = {
  leverMinSpeed: 50,
  leverMaxSpeed: 50,
  vibrationMinSpeed: 50,
  vibrationMaxSpeed: 50,
  vibrationMinTime: 200,
  vibrationMaxTime: 2000,
};

const getPositionNumber = (positionNo: string) => Number(positionNo) || 0;

const createEmptyPosition = (index: number): NeedlePositionRecord => {
  const positionNo = String(index + 1).padStart(2, '0');
  return {
    id: `needle-position-${positionNo}`,
    positionNo,
    needleId: '',
    needleName: '',
    model: '',
    needleTip: '',
    needleNo: '',
    brand: '',
    stock: 0,
    faultStatus: '绑定设备正常',
    displayOrder: index + 1,
    ...defaultMotionSettings,
  };
};

const createInitialPositions = () => {
  return Array.from({ length: 30 }, (_, index) => {
    const position = createEmptyPosition(index);
    const option = needleOptions[index % needleOptions.length];
    if ([0, 1, 4, 5, 8, 9, 10].includes(index)) {
      return {
        ...position,
        needleId: option.id,
        needleName: option.name,
        model: option.model,
        needleTip: option.needleTip,
        needleNo: option.needleNo,
        brand: option.brand,
        stock: [18, 15, 20, 12, 9, 16, 7][[0, 1, 4, 5, 8, 9, 10].indexOf(index)] ?? 0,
      };
    }
    return position;
  });
};

const positions = ref<NeedlePositionRecord[]>(createInitialPositions());
const selectedIds = ref<string[]>([]);
const importInputRef = ref<HTMLInputElement | null>(null);
const editingId = ref<string | null>(null);

const query = reactive({
  keyword: '',
});

const form = reactive({
  positionNo: '',
  stock: 0,
  needleId: '',
  displayOrder: 1,
  leverMinSpeed: defaultMotionSettings.leverMinSpeed,
  leverMaxSpeed: defaultMotionSettings.leverMaxSpeed,
  vibrationMinSpeed: defaultMotionSettings.vibrationMinSpeed,
  vibrationMaxSpeed: defaultMotionSettings.vibrationMaxSpeed,
  vibrationMinTime: defaultMotionSettings.vibrationMinTime,
  vibrationMaxTime: defaultMotionSettings.vibrationMaxTime,
});

const selectedNeedle = computed(() => needleOptions.find(item => item.id === form.needleId));

const filteredPositions = computed(() => {
  const keyword = query.keyword.trim();
  return positions.value
    .filter(item => {
      if (!keyword) return true;
      return [
        item.positionNo,
        item.needleName,
        item.model,
        item.needleTip,
        item.needleNo,
        item.brand,
        item.faultStatus,
      ].some(value => String(value).includes(keyword));
    })
    .sort((a, b) => a.displayOrder - b.displayOrder);
});

const allFilteredSelected = computed(() => filteredPositions.value.length > 0 && filteredPositions.value.every(item => selectedIds.value.includes(item.id)));

const normalizeNumber = (value: number, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, normalizeNumber(value, min)));

const resetQuery = () => {
  query.keyword = '';
};

const clearBinding = (position: NeedlePositionRecord): NeedlePositionRecord => ({
  ...position,
  needleId: '',
  needleName: '',
  model: '',
  needleTip: '',
  needleNo: '',
  brand: '',
  stock: 0,
  faultStatus: '绑定设备正常',
  displayOrder: getPositionNumber(position.positionNo),
});

const unbindSelected = () => {
  if (selectedIds.value.length === 0) return;
  if (!window.confirm(`确认解绑选中的 ${selectedIds.value.length} 个针位？`)) return;
  const selected = new Set(selectedIds.value);
  positions.value = positions.value.map(item => selected.has(item.id) ? clearBinding(item) : item);
  selectedIds.value = [];
};

const unbindAll = () => {
  if (!window.confirm('确认解绑全部针位的机针？')) return;
  positions.value = positions.value.map(clearBinding);
  selectedIds.value = [];
};

const toggleRow = (id: string) => {
  selectedIds.value = selectedIds.value.includes(id)
    ? selectedIds.value.filter(item => item !== id)
    : [...selectedIds.value, id];
};

const toggleAllFiltered = () => {
  if (allFilteredSelected.value) {
    const visible = new Set(filteredPositions.value.map(item => item.id));
    selectedIds.value = selectedIds.value.filter(id => !visible.has(id));
    return;
  }
  selectedIds.value = Array.from(new Set([...selectedIds.value, ...filteredPositions.value.map(item => item.id)]));
};

const startEdit = (position: NeedlePositionRecord) => {
  editingId.value = position.id;
  form.positionNo = position.positionNo;
  form.stock = position.stock;
  form.needleId = position.needleId;
  form.displayOrder = position.displayOrder || getPositionNumber(position.positionNo);
  form.leverMinSpeed = position.leverMinSpeed;
  form.leverMaxSpeed = position.leverMaxSpeed;
  form.vibrationMinSpeed = position.vibrationMinSpeed;
  form.vibrationMaxSpeed = position.vibrationMaxSpeed;
  form.vibrationMinTime = position.vibrationMinTime;
  form.vibrationMaxTime = position.vibrationMaxTime;
};

const closeEdit = () => {
  editingId.value = null;
};

const clearNeedleSelection = () => {
  form.needleId = '';
};

const saveEdit = () => {
  if (!editingId.value) return;
  const option = selectedNeedle.value;
  const payload = {
    needleId: option?.id ?? '',
    needleName: option?.name ?? '',
    model: option?.model ?? '',
    needleTip: option?.needleTip ?? '',
    needleNo: option?.needleNo ?? '',
    brand: option?.brand ?? '',
    stock: option ? Math.max(0, normalizeNumber(form.stock)) : 0,
    faultStatus: '绑定设备正常' as const,
    displayOrder: Math.max(1, normalizeNumber(form.displayOrder, getPositionNumber(form.positionNo))),
    leverMinSpeed: clamp(form.leverMinSpeed, 0, 100),
    leverMaxSpeed: clamp(form.leverMaxSpeed, 0, 100),
    vibrationMinSpeed: clamp(form.vibrationMinSpeed, 0, 100),
    vibrationMaxSpeed: clamp(form.vibrationMaxSpeed, 0, 100),
    vibrationMinTime: clamp(form.vibrationMinTime, 0, 5000),
    vibrationMaxTime: clamp(form.vibrationMaxTime, 0, 5000),
  };
  positions.value = positions.value.map(item => item.id === editingId.value ? { ...item, ...payload } : item);
  closeEdit();
};

const escapeCsvCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;

const exportPositions = () => {
  const header = [
    '针位编号',
    '机针名称',
    '型号',
    '针尖',
    '针号',
    '品牌',
    '库存',
    '是否故障',
    '显示序号',
    '拨杆电机最小速度',
    '拨杆电机最大速度',
    '振动电机最小速度',
    '振动电机最大速度',
    '最小振动时间',
    '最大振动时间',
  ];
  const rows = filteredPositions.value.map(item => [
    item.positionNo,
    item.needleName,
    item.model,
    item.needleTip,
    item.needleNo,
    item.brand,
    item.stock,
    item.faultStatus,
    item.displayOrder,
    item.leverMinSpeed,
    item.leverMaxSpeed,
    item.vibrationMinSpeed,
    item.vibrationMaxSpeed,
    item.vibrationMinTime,
    item.vibrationMaxTime,
  ]);
  const csv = [header, ...rows].map(row => row.map(escapeCsvCell).join(',')).join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `针位管理_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const splitCsvLine = (line: string) => {
  const result: string[] = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

const findNeedleByImportedRow = (row: string[]) => {
  return needleOptions.find(item => (
    item.name === row[1]
    && item.model === row[2]
    && item.needleTip === row[3]
    && item.needleNo === row[4]
    && item.brand === row[5]
  ));
};

const importPositions = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const lines = String(reader.result ?? '')
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);
    const rows = lines.slice(1).map(splitCsvLine);
    const importedByNo = new Map<string, Partial<NeedlePositionRecord>>();
    rows.forEach(row => {
      const positionNo = String(row[0] ?? '').padStart(2, '0');
      if (!/^\d{2}$/.test(positionNo) || Number(positionNo) < 1 || Number(positionNo) > 30) return;
      const option = findNeedleByImportedRow(row);
      importedByNo.set(positionNo, {
        needleId: option?.id ?? '',
        needleName: row[1] || '',
        model: row[2] || '',
        needleTip: row[3] || '',
        needleNo: row[4] || '',
        brand: row[5] || '',
        stock: Math.max(0, Number(row[6]) || 0),
        faultStatus: row[7] === '绑定设备故障' ? '绑定设备故障' : '绑定设备正常',
        displayOrder: Math.max(1, Number(row[8]) || Number(positionNo)),
        leverMinSpeed: clamp(Number(row[9]), 0, 100),
        leverMaxSpeed: clamp(Number(row[10]), 0, 100),
        vibrationMinSpeed: clamp(Number(row[11]), 0, 100),
        vibrationMaxSpeed: clamp(Number(row[12]), 0, 100),
        vibrationMinTime: clamp(Number(row[13]), 0, 5000),
        vibrationMaxTime: clamp(Number(row[14]), 0, 5000),
      });
    });
    positions.value = positions.value.map(item => {
      const imported = importedByNo.get(item.positionNo);
      return imported ? { ...item, ...imported } : item;
    });
    input.value = '';
  };
  reader.readAsText(file, 'utf-8');
};
</script>

<template>
  <div class="org-page needle-position-page">
    <div class="org-header">
      <div>
        <h1>针位管理</h1>
      </div>
    </div>

    <section class="org-list-card needle-position-card">
      <div class="role-list-head needle-position-head">
        <div class="org-section-heading">
          <span></span>
          <h2>针盒列表</h2>
        </div>
        <div class="needle-toolbar needle-position-toolbar">
          <label class="role-search needle-search needle-position-search">
            <Search :size="22" :stroke-width="2.1" />
            <input v-model="query.keyword" type="text" placeholder="输入机针属性或针位编号搜索" />
          </label>
          <button type="button" class="org-secondary-btn needle-tool-btn" @click="resetQuery">
            <X :size="18" :stroke-width="2.1" />
            重置
          </button>
          <button type="button" class="org-secondary-btn needle-position-action" :disabled="selectedIds.length === 0" @click="unbindSelected">
            <Trash2 :size="18" :stroke-width="2.1" />
            解绑选中
          </button>
          <button type="button" class="org-secondary-btn needle-position-action" @click="unbindAll">
            <RotateCcw :size="18" :stroke-width="2.1" />
            解绑全部
          </button>
          <button type="button" class="org-secondary-btn needle-tool-btn" @click="importInputRef?.click()">
            <Upload :size="18" :stroke-width="2.1" />
            导入
          </button>
          <button type="button" class="org-primary-btn needle-tool-btn" @click="exportPositions">
            <Download :size="18" :stroke-width="2.1" />
            导出
          </button>
          <input ref="importInputRef" class="hidden-file-input" type="file" accept=".csv,text/csv" @change="importPositions" />
        </div>
      </div>

      <div class="needle-position-summary">
        <span>默认显示 30 个针盒</span>
        <span>已选择 {{ selectedIds.length }} 个</span>
      </div>

      <div class="needle-position-table">
        <div class="needle-position-row needle-position-head-row">
          <div>
            <button type="button" class="needle-position-check" :class="{ checked: allFilteredSelected }" @click="toggleAllFiltered">
              <Check v-if="allFilteredSelected" :size="18" :stroke-width="2.5" />
            </button>
          </div>
          <div>针位编号</div>
          <div>机针名称</div>
          <div>型号</div>
          <div>针尖</div>
          <div>针号</div>
          <div>品牌</div>
          <div>库存</div>
          <div>是否故障</div>
          <div>显示序号</div>
          <div>操作</div>
        </div>
        <div v-for="position in filteredPositions" :key="position.id" class="needle-position-row">
          <div>
            <button type="button" class="needle-position-check" :class="{ checked: selectedIds.includes(position.id) }" @click="toggleRow(position.id)">
              <Check v-if="selectedIds.includes(position.id)" :size="18" :stroke-width="2.5" />
            </button>
          </div>
          <div class="needle-position-no">{{ position.positionNo }}</div>
          <div>{{ position.needleName || '-' }}</div>
          <div>{{ position.model || '-' }}</div>
          <div>{{ position.needleTip || '-' }}</div>
          <div>{{ position.needleNo || '-' }}</div>
          <div>{{ position.brand || '-' }}</div>
          <div>{{ position.stock }}</div>
          <div>
            <span :class="['needle-position-status', position.faultStatus === '绑定设备故障' && 'error']">{{ position.faultStatus }}</span>
          </div>
          <div>{{ position.displayOrder }}</div>
          <div class="org-row-actions needle-actions">
            <button type="button" @click="startEdit(position)">
              <Pencil :size="18" />
              修改
            </button>
          </div>
        </div>
        <div v-if="filteredPositions.length === 0" class="org-empty">暂无匹配针位信息。</div>
      </div>
    </section>

    <div v-if="editingId" class="needle-position-modal-layer">
      <section class="needle-position-modal">
        <div class="role-permission-header">
          <div>
            <h2>修改针位</h2>
            <p>编号 {{ form.positionNo }} · 可调整绑定机针、库存和电机参数</p>
          </div>
          <button type="button" @click="closeEdit">
            <X :size="30" :stroke-width="2.2" />
          </button>
        </div>

        <div class="needle-position-modal-body">
          <div class="needle-position-form-grid">
            <label class="org-field">
              <span>编号</span>
              <input v-model="form.positionNo" type="text" disabled />
            </label>
            <label class="org-field">
              <span>库存</span>
              <input v-model.number="form.stock" min="0" type="number" :disabled="!form.needleId" />
            </label>
            <label class="org-field needle-position-needle-field">
              <span>机针</span>
              <div class="needle-position-needle-select">
                <select v-model="form.needleId">
                  <option value="">未绑定机针</option>
                  <option v-for="needle in needleOptions" :key="needle.id" :value="needle.id">
                    {{ needle.name }} / {{ needle.model }} / {{ needle.needleNo }}
                  </option>
                </select>
                <button type="button" @click="clearNeedleSelection">清空</button>
              </div>
            </label>
            <label class="org-field">
              <span>显示序号</span>
              <input v-model.number="form.displayOrder" min="1" type="number" />
            </label>
          </div>

          <div class="needle-position-slider-list">
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
              <input v-model.number="form.vibrationMinTime" type="range" min="0" max="5000" step="50" />
              <strong>{{ form.vibrationMinTime }}</strong>
            </label>
            <label class="needle-position-slider">
              <span>最大振动时间</span>
              <input v-model.number="form.vibrationMaxTime" type="range" min="0" max="5000" step="50" />
              <strong>{{ form.vibrationMaxTime }}</strong>
            </label>
          </div>
        </div>

        <div class="role-permission-actions">
          <button type="button" class="org-secondary-btn" @click="closeEdit">取消</button>
          <button type="button" class="org-primary-btn" @click="saveEdit">确定</button>
        </div>
      </section>
    </div>
  </div>
</template>
