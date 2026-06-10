<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import {
  ChevronDown,
  Download,
  FileDown,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-vue-next';
import type { ComponentStatus, DeviceComponentRecord } from '../types';

type DialogMode = 'add' | 'edit' | 'delete' | 'upgrade' | 'version' | 'reboot' | null;
type ComponentType = DeviceComponentRecord['type'];

const deviceModel = '机针宝 ZJ-NC-3000';
const importInputRef = ref<HTMLInputElement | null>(null);
const activeDialog = ref<DialogMode>(null);
const activeRecordId = ref<string | null>(null);
const activeUpgradeType = ref<ComponentType | ''>('');
const operationMessage = ref('');
const isMoreMenuOpen = ref(false);

const componentTypes: ComponentType[] = ['储针部件', '集中控制器', '包针部件', '人脸识别部件', '打印部件'];
const componentStatuses: ComponentStatus[] = ['正常', '离线', '故障', '升级中'];

const components = ref<DeviceComponentRecord[]>([
  { id: 'component-needle-01', name: '储针部件 01', address: 'CAN-01', type: '储针部件', status: '正常', version: 'V2.3.1' },
  { id: 'component-needle-02', name: '储针部件 02', address: 'CAN-02', type: '储针部件', status: '正常', version: 'V2.3.1' },
  { id: 'component-controller', name: '集中控制器', address: 'LAN-192.168.10.20', type: '集中控制器', status: '正常', version: 'V4.1.0' },
  { id: 'component-package', name: '包针部件', address: 'CAN-08', type: '包针部件', status: '离线', version: 'V1.8.4' },
  { id: 'component-face', name: '人脸识别部件', address: 'USB-01', type: '人脸识别部件', status: '故障', version: 'V3.0.2' },
]);

const query = reactive({
  status: '',
  keyword: '',
});

const form = reactive({
  name: '',
  address: '',
  type: '储针部件' as ComponentType,
  status: '正常' as ComponentStatus,
  version: '',
});

const activeRecord = computed(() => components.value.find(item => item.id === activeRecordId.value) ?? null);

const statusStats = computed(() => componentStatuses.map(status => ({
  status,
  total: components.value.filter(item => item.status === status).length,
})));

const filteredComponents = computed(() => {
  const keyword = query.keyword.trim();
  return components.value.filter(item => {
    const matchesStatus = !query.status || item.status === query.status;
    const matchesKeyword = !keyword || [item.name, item.address, item.type, item.version].some(value => value.includes(keyword));
    return matchesStatus && matchesKeyword;
  });
});

const resetForm = () => {
  form.name = '';
  form.address = '';
  form.type = '储针部件';
  form.status = '正常';
  form.version = '';
};

const openAddDialog = () => {
  activeRecordId.value = null;
  resetForm();
  activeDialog.value = 'add';
};

const openEditDialog = (record: DeviceComponentRecord) => {
  activeRecordId.value = record.id;
  form.name = record.name;
  form.address = record.address;
  form.type = record.type;
  form.status = record.status;
  form.version = record.version;
  activeDialog.value = 'edit';
};

const openDeleteDialog = (record: DeviceComponentRecord) => {
  activeRecordId.value = record.id;
  activeDialog.value = 'delete';
};

const openUpgradeDialog = (type: ComponentType) => {
  isMoreMenuOpen.value = false;
  activeUpgradeType.value = type;
  operationMessage.value = '';
  activeDialog.value = 'upgrade';
};

const openVersionDialog = () => {
  isMoreMenuOpen.value = false;
  operationMessage.value = `已完成 ${components.value.length} 个部件版本查询。`;
  activeDialog.value = 'version';
};

const openRebootDialog = () => {
  isMoreMenuOpen.value = false;
  operationMessage.value = '';
  activeDialog.value = 'reboot';
};

const closeDialog = () => {
  activeDialog.value = null;
  activeRecordId.value = null;
  activeUpgradeType.value = '';
  operationMessage.value = '';
};

const saveComponent = () => {
  const payload = {
    name: form.name.trim(),
    address: form.address.trim(),
    type: form.type,
    status: form.status,
    version: form.version.trim(),
  };
  if (!payload.name || !payload.address || !payload.version) return;

  if (activeDialog.value === 'edit' && activeRecordId.value) {
    components.value = components.value.map(item => item.id === activeRecordId.value ? { ...item, ...payload } : item);
  } else {
    components.value = [{ id: `component-${Date.now()}`, ...payload }, ...components.value];
  }
  closeDialog();
};

const deleteComponent = () => {
  if (!activeRecordId.value) return;
  components.value = components.value.filter(item => item.id !== activeRecordId.value);
  closeDialog();
};

const refreshDevices = () => {
  isMoreMenuOpen.value = false;
  operationMessage.value = `已刷新设备状态，当前机型 ${deviceModel}。`;
  activeDialog.value = 'version';
};

const resetQuery = () => {
  query.status = '';
  query.keyword = '';
};

const escapeCsvCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;

const downloadCsv = (filename: string, rows: Array<Array<string | number>>) => {
  const csv = rows.map(row => row.map(escapeCsvCell).join(',')).join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const exportComponents = () => {
  isMoreMenuOpen.value = false;
  downloadCsv(`部件状态_${new Date().toISOString().slice(0, 10)}.csv`, [
    ['名称', '地址', '类型', '状态', '版本'],
    ...filteredComponents.value.map(item => [item.name, item.address, item.type, item.status, item.version]),
  ]);
};

const downloadTemplate = () => {
  isMoreMenuOpen.value = false;
  downloadCsv('部件状态导入模板.csv', [
    ['名称', '地址', '类型', '状态', '版本'],
    ['储针部件 03', 'CAN-03', '储针部件', '正常', 'V2.3.1'],
  ]);
};

const openImportPicker = () => {
  isMoreMenuOpen.value = false;
  importInputRef.value?.click();
};

const splitCsvLine = (line: string) => {
  const result: string[] = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
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

const isComponentType = (value: string): value is ComponentType => componentTypes.includes(value as ComponentType);
const isComponentStatus = (value: string): value is ComponentStatus => componentStatuses.includes(value as ComponentStatus);

const importComponents = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const rows = String(reader.result ?? '')
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
      .slice(1)
      .map(splitCsvLine)
      .map(row => {
        const type = isComponentType(row[2]) ? row[2] : '储针部件';
        const status = isComponentStatus(row[3]) ? row[3] : '正常';
        return {
          id: `component-import-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          name: row[0] || '未命名部件',
          address: row[1] || '-',
          type,
          status,
          version: row[4] || 'V1.0.0',
        };
      });
    if (rows.length > 0) {
      components.value = [...rows, ...components.value];
    }
    input.value = '';
  };
  reader.readAsText(file, 'utf-8');
};

const toggleMoreMenu = () => {
  isMoreMenuOpen.value = !isMoreMenuOpen.value;
};

const closeMoreMenu = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null;
  if (!target?.closest('.component-more')) {
    isMoreMenuOpen.value = false;
  }
};

onMounted(() => {
  window.addEventListener('click', closeMoreMenu);
});

onBeforeUnmount(() => {
  window.removeEventListener('click', closeMoreMenu);
});

const confirmUpgrade = () => {
  if (!activeUpgradeType.value) return;
  components.value = components.value.map(item => (
    item.type === activeUpgradeType.value ? { ...item, status: '升级中' } : item
  ));
  operationMessage.value = `${activeUpgradeType.value}升级任务已下发。`;
};

const confirmReboot = () => {
  components.value = components.value.map(item => ({ ...item, status: item.status === '离线' ? item.status : '正常' }));
  operationMessage.value = '重启指令已下发到全部在线设备。';
};
</script>

<template>
  <div class="org-page component-page">
    <div class="org-header component-header">
      <div>
        <h1>部件状态</h1>
      </div>
      <div class="component-model">
        <span>当前设备型号</span>
        <strong>{{ deviceModel }}</strong>
      </div>
    </div>

    <section class="org-list-card component-card">
      <div class="role-list-head component-list-head">
        <div class="org-section-heading">
          <span></span>
          <h2>部件列表</h2>
        </div>
        <div class="needle-toolbar component-toolbar">
          <label class="role-search needle-search component-search">
            <Search :size="22" :stroke-width="2.1" />
            <input v-model="query.keyword" type="text" placeholder="输入名称、地址、类型或版本搜索" />
          </label>
          <select v-model="query.status" class="component-status-select">
            <option value="">全部状态</option>
            <option v-for="status in componentStatuses" :key="status" :value="status">{{ status }}</option>
          </select>
          <button type="button" class="org-secondary-btn needle-tool-btn" @click="resetQuery">
            <X :size="18" :stroke-width="2.1" />
            重置
          </button>
          <button type="button" class="org-primary-btn needle-tool-btn" @click="openAddDialog">
            <Plus :size="18" :stroke-width="2.1" />
            添加
          </button>
          <div class="component-more">
            <button type="button" class="org-secondary-btn component-action-btn" @click="toggleMoreMenu">
              其他功能
              <ChevronDown :size="18" :stroke-width="2.1" />
            </button>
            <div v-if="isMoreMenuOpen" class="component-more-menu">
              <button type="button" @click="refreshDevices">
                <RefreshCw :size="18" :stroke-width="2.1" />
                刷新设备
              </button>
              <button type="button" @click="exportComponents">
                <Download :size="18" :stroke-width="2.1" />
                导出
              </button>
              <button type="button" @click="downloadTemplate">
                <FileDown :size="18" :stroke-width="2.1" />
                下载导入模版
              </button>
              <button type="button" @click="openImportPicker">
                <Upload :size="18" :stroke-width="2.1" />
                导入
              </button>
              <button type="button" @click="openUpgradeDialog('储针部件')">升级储针部件</button>
              <button type="button" @click="openUpgradeDialog('集中控制器')">升级集中控制器</button>
              <button type="button" @click="openUpgradeDialog('包针部件')">升级包针部件</button>
              <button type="button" @click="openVersionDialog">版本查询</button>
              <button type="button" class="danger" @click="openRebootDialog">重启所有设备</button>
            </div>
          </div>
          <input ref="importInputRef" class="hidden-file-input" type="file" accept=".csv,text/csv" @change="importComponents" />
        </div>
      </div>

      <div class="component-summary">
        <span v-for="item in statusStats" :key="item.status">
          {{ item.status }} {{ item.total }}
        </span>
      </div>

      <div class="component-table">
        <div class="component-table-row component-table-head-row">
          <div>名称</div>
          <div>地址</div>
          <div>类型</div>
          <div>状态</div>
          <div>版本</div>
          <div>操作</div>
        </div>
        <div v-for="component in filteredComponents" :key="component.id" class="component-table-row">
          <div>{{ component.name }}</div>
          <div>{{ component.address }}</div>
          <div>{{ component.type }}</div>
          <div>
            <span :class="['component-status', component.status]">{{ component.status }}</span>
          </div>
          <div>{{ component.version }}</div>
          <div class="org-row-actions component-row-actions">
            <button type="button" @click="openEditDialog(component)">
              <Pencil :size="18" />
              修改
            </button>
            <button type="button" class="danger" @click="openDeleteDialog(component)">
              <Trash2 :size="18" />
              删除
            </button>
          </div>
        </div>
        <div v-if="filteredComponents.length === 0" class="org-empty">暂无匹配部件信息。</div>
      </div>
    </section>

    <div v-if="activeDialog" class="role-permission-layer">
      <section class="component-dialog">
        <div class="role-permission-header">
          <div>
            <h2 v-if="activeDialog === 'add'">添加部件</h2>
            <h2 v-else-if="activeDialog === 'edit'">修改部件</h2>
            <h2 v-else-if="activeDialog === 'delete'">删除部件</h2>
            <h2 v-else-if="activeDialog === 'upgrade'">设备升级</h2>
            <h2 v-else-if="activeDialog === 'version'">版本查询</h2>
            <h2 v-else>重启所有设备</h2>
            <p>{{ activeRecord?.name || activeUpgradeType || deviceModel }}</p>
          </div>
          <button type="button" @click="closeDialog">
            <X :size="28" />
          </button>
        </div>

        <div class="component-dialog-body">
          <div v-if="activeDialog === 'add' || activeDialog === 'edit'" class="component-form-grid">
            <label class="org-field">
              <span>名称</span>
              <input v-model="form.name" type="text" placeholder="请输入部件名称" />
            </label>
            <label class="org-field">
              <span>地址</span>
              <input v-model="form.address" type="text" placeholder="请输入通信地址" />
            </label>
            <label class="org-field">
              <span>类型</span>
              <select v-model="form.type">
                <option v-for="type in componentTypes" :key="type" :value="type">{{ type }}</option>
              </select>
            </label>
            <label class="org-field">
              <span>状态</span>
              <select v-model="form.status">
                <option v-for="status in componentStatuses" :key="status" :value="status">{{ status }}</option>
              </select>
            </label>
            <label class="org-field component-version-field">
              <span>版本</span>
              <input v-model="form.version" type="text" placeholder="请输入版本号" />
            </label>
          </div>

          <div v-else-if="activeDialog === 'delete'" class="component-confirm-copy">
            确认删除“{{ activeRecord?.name }}”？删除后当前列表将不再显示该部件。
          </div>

          <div v-else-if="activeDialog === 'upgrade'" class="component-confirm-copy">
            将向全部“{{ activeUpgradeType }}”下发升级任务。当前前端仅模拟任务状态，请后续接入真实升级包选择和设备接口。
            <p v-if="operationMessage">{{ operationMessage }}</p>
          </div>

          <div v-else-if="activeDialog === 'version'" class="component-version-list">
            <div class="component-confirm-copy">{{ operationMessage }}</div>
            <div v-for="component in components" :key="component.id" class="component-version-item">
              <span>{{ component.name }}</span>
              <strong>{{ component.version }}</strong>
            </div>
          </div>

          <div v-else class="component-confirm-copy">
            将对全部在线设备下发重启指令，离线设备保持原状态。
            <p v-if="operationMessage">{{ operationMessage }}</p>
          </div>
        </div>

        <div class="role-permission-actions">
          <button type="button" class="org-secondary-btn" @click="closeDialog">取消</button>
          <button v-if="activeDialog === 'add' || activeDialog === 'edit'" type="button" class="org-primary-btn" @click="saveComponent">确定</button>
          <button v-else-if="activeDialog === 'delete'" type="button" class="org-primary-btn danger-solid" @click="deleteComponent">确定删除</button>
          <button v-else-if="activeDialog === 'upgrade'" type="button" class="org-primary-btn" @click="confirmUpgrade">开始升级</button>
          <button v-else-if="activeDialog === 'reboot'" type="button" class="org-primary-btn danger-solid" @click="confirmReboot">确认重启</button>
        </div>
      </section>
    </div>
  </div>
</template>
