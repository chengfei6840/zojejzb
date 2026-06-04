<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue';
import { Download, ImagePlus, Loader2, Pencil, Plus, Search, Trash2, Upload, X } from 'lucide-vue-next';
import type { NeedleRecord } from '../types';

const DEFAULT_IMAGE = `${import.meta.env.BASE_URL}assets/sewing-machine-wide.png`;

const createTimeText = () => {
  const now = new Date();
  const pad = (value: number) => value.toString().padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

const needles = ref<NeedleRecord[]>([
  {
    id: 'needle-db-90',
    name: 'A8100平车',
    model: 'DBx1HS',
    needleTip: 'R/SET',
    needleNo: '90/14#',
    usage: 'A8100平缝',
    brand: '格罗茨',
    length: 37.4,
    spareWarehouse: 5,
    displayOrder: 1,
    image: DEFAULT_IMAGE,
    createdAt: '2026-06-03 10:00',
  },
  {
    id: 'needle-dc-75',
    name: '包缝机针',
    model: 'DCx27',
    needleTip: '圆尖',
    needleNo: '75/11#',
    usage: '薄料包缝',
    brand: '风琴',
    length: 33.9,
    spareWarehouse: 3,
    displayOrder: 2,
    image: DEFAULT_IMAGE,
    createdAt: '2026-06-03 10:08',
  },
  {
    id: 'needle-dp-110',
    name: '厚料机针',
    model: 'DPx5',
    needleTip: '尖头',
    needleNo: '110/18#',
    usage: '厚料缝制',
    brand: '蓝狮',
    length: 38.1,
    spareWarehouse: 7,
    displayOrder: 3,
    image: DEFAULT_IMAGE,
    createdAt: '2026-06-03 10:16',
  },
]);

const editingId = ref<string | null>(null);
const importInputRef = ref<HTMLInputElement | null>(null);
const imageInputRef = ref<HTMLInputElement | null>(null);
const isRecognizing = ref(false);
const RECOGNIZED_NEEDLE_LENGTH = 37.4;
let recognitionTimer: ReturnType<typeof setTimeout> | null = null;

const query = reactive({
  keyword: '',
  model: '',
  needleTip: '',
  needleNo: '',
  usage: '',
  brand: '',
});

const form = reactive({
  name: '',
  model: '',
  needleTip: '',
  needleNo: '',
  usage: '',
  brand: '',
  displayOrder: 1,
  spareWarehouse: 0,
  length: 0,
  image: DEFAULT_IMAGE,
});

const uniqueOptions = (field: keyof Pick<NeedleRecord, 'model' | 'needleTip' | 'needleNo' | 'usage' | 'brand'>) => {
  return Array.from(new Set(needles.value.map(item => item[field]).filter(Boolean)));
};

const modelOptions = computed(() => uniqueOptions('model'));
const tipOptions = computed(() => uniqueOptions('needleTip'));
const noOptions = computed(() => uniqueOptions('needleNo'));
const usageOptions = computed(() => uniqueOptions('usage'));
const brandOptions = computed(() => uniqueOptions('brand'));

const filteredNeedles = computed(() => {
  const keyword = query.keyword.trim();
  return needles.value
    .filter(item => {
      const matchesKeyword = !keyword || [
        item.name,
        item.model,
        item.needleTip,
        item.needleNo,
        item.usage,
        item.brand,
      ].some(value => value.includes(keyword));
      const matchesModel = !query.model || item.model === query.model;
      const matchesTip = !query.needleTip || item.needleTip === query.needleTip;
      const matchesNo = !query.needleNo || item.needleNo === query.needleNo;
      const matchesUsage = !query.usage || item.usage === query.usage;
      const matchesBrand = !query.brand || item.brand === query.brand;
      return matchesKeyword && matchesModel && matchesTip && matchesNo && matchesUsage && matchesBrand;
    })
    .sort((a, b) => a.displayOrder - b.displayOrder);
});

const resetForm = () => {
  editingId.value = null;
  form.name = '';
  form.model = '';
  form.needleTip = '';
  form.needleNo = '';
  form.usage = '';
  form.brand = '';
  form.displayOrder = needles.value.length + 1;
  form.spareWarehouse = 0;
  form.length = 0;
  form.image = DEFAULT_IMAGE;
};

const resetQuery = () => {
  query.keyword = '';
  query.model = '';
  query.needleTip = '';
  query.needleNo = '';
  query.usage = '';
  query.brand = '';
};

const normalizeNumber = (value: number, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const saveNeedle = () => {
  const payload = {
    name: form.name.trim(),
    model: form.model.trim(),
    needleTip: form.needleTip.trim(),
    needleNo: form.needleNo.trim(),
    usage: form.usage.trim(),
    brand: form.brand.trim(),
    length: normalizeNumber(form.length),
    spareWarehouse: normalizeNumber(form.spareWarehouse),
    displayOrder: normalizeNumber(form.displayOrder, needles.value.length + 1),
    image: form.image || DEFAULT_IMAGE,
  };

  if (!payload.name || !payload.model || !payload.needleTip || !payload.needleNo || !payload.usage || !payload.brand) {
    return;
  }

  if (!window.confirm('确认是否保存机针信息？')) {
    return;
  }

  if (editingId.value) {
    needles.value = needles.value.map(item => item.id === editingId.value ? { ...item, ...payload } : item);
  } else {
    needles.value = [
      ...needles.value,
      {
        id: `needle-${Date.now()}`,
        ...payload,
        createdAt: createTimeText(),
      },
    ];
  }

  resetForm();
};

const startEdit = (needle: NeedleRecord) => {
  editingId.value = needle.id;
  form.name = needle.name;
  form.model = needle.model;
  form.needleTip = needle.needleTip;
  form.needleNo = needle.needleNo;
  form.usage = needle.usage;
  form.brand = needle.brand;
  form.displayOrder = needle.displayOrder;
  form.spareWarehouse = needle.spareWarehouse;
  form.length = needle.length;
  form.image = needle.image;
};

const deleteNeedle = (needleId: string) => {
  needles.value = needles.value.filter(item => item.id !== needleId);
  if (editingId.value === needleId) {
    resetForm();
  }
};

const escapeCsvCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;

const exportNeedles = () => {
  const header = ['机针名称', '型号', '针尖', '针号', '用途', '品牌', '长度(0.1mm)', '备用仓', '显示序号'];
  const rows = filteredNeedles.value.map(item => [
    item.name,
    item.model,
    item.needleTip,
    item.needleNo,
    item.usage,
    item.brand,
    item.length,
    item.spareWarehouse,
    item.displayOrder,
  ]);
  const csv = [header, ...rows].map(row => row.map(escapeCsvCell).join(',')).join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `机针管理_${new Date().toISOString().slice(0, 10)}.csv`;
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

const importNeedles = (event: Event) => {
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
    const imported = rows
      .filter(row => row.length >= 8)
      .map((row, index): NeedleRecord => ({
        id: `needle-import-${Date.now()}-${index}`,
        name: row[0],
        model: row[1],
        needleTip: row[2],
        needleNo: row[3],
        usage: row[4],
        brand: row[5],
        length: Number(row[6]) || 0,
        spareWarehouse: Number(row[7]) || 0,
        displayOrder: Number(row[8]) || needles.value.length + index + 1,
        image: DEFAULT_IMAGE,
        createdAt: createTimeText(),
      }));
    if (imported.length > 0) {
      needles.value = [...needles.value, ...imported];
    }
    input.value = '';
  };
  reader.readAsText(file, 'utf-8');
};

const chooseImage = () => {
  imageInputRef.value?.click();
};

const onImageChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    form.image = String(reader.result || DEFAULT_IMAGE);
    input.value = '';
  };
  reader.readAsDataURL(file);
};

const openRecognition = () => {
  if (recognitionTimer) {
    clearTimeout(recognitionTimer);
  }
  isRecognizing.value = true;
  recognitionTimer = setTimeout(() => {
    form.length = RECOGNIZED_NEEDLE_LENGTH;
    isRecognizing.value = false;
    recognitionTimer = null;
  }, 3000);
};

const closeRecognition = () => {
  if (recognitionTimer) {
    clearTimeout(recognitionTimer);
    recognitionTimer = null;
  }
  isRecognizing.value = false;
};

onBeforeUnmount(() => {
  if (recognitionTimer) {
    clearTimeout(recognitionTimer);
  }
});

resetForm();
</script>

<template>
  <div class="org-page needle-page">
    <div class="org-header">
      <div>
        <h1>机针管理</h1>
      </div>
    </div>

    <div class="org-layout needle-layout">
      <section class="org-form-card needle-form-card">
        <div class="org-section-heading">
          <span></span>
          <h2>{{ editingId ? '修改机针信息' : '新增机针信息' }}</h2>
        </div>

        <div class="needle-form-grid">
          <label class="org-field">
            <span>机针名称</span>
            <input v-model="form.name" type="text" placeholder="请输入机针名称" />
          </label>
          <label class="org-field">
            <span>型号</span>
            <input v-model="form.model" type="text" placeholder="请输入型号" />
          </label>
          <label class="org-field">
            <span>针尖</span>
            <input v-model="form.needleTip" type="text" placeholder="请输入针尖" />
          </label>
          <label class="org-field">
            <span>针号</span>
            <input v-model="form.needleNo" type="text" placeholder="请输入针号" />
          </label>
          <label class="org-field">
            <span>用途</span>
            <input v-model="form.usage" type="text" placeholder="请输入用途" />
          </label>
          <label class="org-field">
            <span>品牌</span>
            <input v-model="form.brand" type="text" placeholder="请输入品牌" />
          </label>
          <label class="org-field">
            <span>显示序号</span>
            <input v-model.number="form.displayOrder" min="1" type="number" />
          </label>
          <label class="org-field">
            <span>备用仓</span>
            <input v-model.number="form.spareWarehouse" min="0" type="number" />
          </label>
          <label class="org-field">
            <span>长度</span>
            <div class="needle-length-control">
              <div class="needle-length-input">
                <input v-model.number="form.length" min="0" step="0.1" type="number" placeholder="请输入长度" />
                <span>mm</span>
              </div>
              <button type="button" @click="openRecognition">识别</button>
            </div>
          </label>
        </div>

        <div class="org-field">
          <span>图片</span>
          <button type="button" class="needle-image-picker" @click="chooseImage">
            <img :src="form.image" alt="机针图片预览" />
            <span>
              <ImagePlus :size="22" :stroke-width="2.1" />
              上传图片
            </span>
          </button>
          <input ref="imageInputRef" class="hidden-file-input" type="file" accept="image/*" @change="onImageChange" />
        </div>

        <div class="org-form-actions needle-form-actions">
          <button type="button" class="org-secondary-btn" @click="resetForm">清空</button>
          <button type="button" class="org-primary-btn" @click="saveNeedle">
            <Plus :size="22" :stroke-width="2.2" />
            {{ editingId ? '保存修改' : '新增机针' }}
          </button>
        </div>
      </section>

      <section class="org-list-card">
        <div class="role-list-head needle-list-head">
          <div class="org-section-heading">
            <span></span>
            <h2>机针列表</h2>
          </div>
          <div class="needle-toolbar">
            <label class="role-search needle-search">
              <Search :size="22" :stroke-width="2.1" />
              <input v-model="query.keyword" type="text" placeholder="输入机针属性搜索" />
            </label>
            <select v-model="query.model">
              <option value="">全部型号</option>
              <option v-for="option in modelOptions" :key="option" :value="option">{{ option }}</option>
            </select>
            <select v-model="query.needleTip">
              <option value="">全部针尖</option>
              <option v-for="option in tipOptions" :key="option" :value="option">{{ option }}</option>
            </select>
            <select v-model="query.needleNo">
              <option value="">全部针号</option>
              <option v-for="option in noOptions" :key="option" :value="option">{{ option }}</option>
            </select>
            <select v-model="query.usage">
              <option value="">全部用途</option>
              <option v-for="option in usageOptions" :key="option" :value="option">{{ option }}</option>
            </select>
            <select v-model="query.brand">
              <option value="">全部品牌</option>
              <option v-for="option in brandOptions" :key="option" :value="option">{{ option }}</option>
            </select>
            <button type="button" class="org-secondary-btn needle-tool-btn" @click="resetQuery">
              <X :size="18" :stroke-width="2.1" />
              重置
            </button>
            <button type="button" class="org-secondary-btn needle-tool-btn" @click="importInputRef?.click()">
              <Upload :size="18" :stroke-width="2.1" />
              导入
            </button>
            <button type="button" class="org-primary-btn needle-tool-btn" @click="exportNeedles">
              <Download :size="18" :stroke-width="2.1" />
              导出
            </button>
            <input ref="importInputRef" class="hidden-file-input" type="file" accept=".csv,text/csv" @change="importNeedles" />
          </div>
        </div>

        <div class="needle-table">
          <div class="needle-table-row needle-table-head-row">
            <div>机针名称</div>
            <div>型号</div>
            <div>针尖</div>
            <div>针号</div>
            <div>用途</div>
            <div>品牌</div>
            <div>长度(0.1mm)</div>
            <div>备用仓</div>
            <div>操作</div>
          </div>
          <div v-for="needle in filteredNeedles" :key="needle.id" class="needle-table-row">
            <div class="needle-name-cell">
              <img :src="needle.image" alt="" />
              <span>{{ needle.name }}</span>
            </div>
            <div>{{ needle.model }}</div>
            <div>{{ needle.needleTip }}</div>
            <div>{{ needle.needleNo }}</div>
            <div>{{ needle.usage }}</div>
            <div>{{ needle.brand }}</div>
            <div>{{ needle.length }}</div>
            <div>{{ needle.spareWarehouse }}</div>
            <div class="org-row-actions needle-actions">
              <button type="button" @click="startEdit(needle)">
                <Pencil :size="18" />
                修改
              </button>
              <button type="button" class="danger" @click="deleteNeedle(needle.id)">
                <Trash2 :size="18" />
                删除
              </button>
            </div>
          </div>
          <div v-if="filteredNeedles.length === 0" class="org-empty">暂无匹配机针信息。</div>
        </div>
      </section>
    </div>

    <div v-if="isRecognizing" class="needle-recognition-layer">
      <section class="needle-recognition-card">
        <div class="needle-recognition-header">
          <span>机针识别</span>
          <button type="button" @click="closeRecognition">
            <X :size="30" :stroke-width="2.2" />
          </button>
        </div>
        <div class="needle-recognition-body">
          <Loader2 :size="122" :stroke-width="1.6" class="needle-recognition-spinner" />
          <div>正在识别机针</div>
        </div>
      </section>
    </div>
  </div>
</template>
