<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { Building2, Factory, Pencil, Plus, Trash2, UsersRound } from 'lucide-vue-next';
import { cn } from '../lib/utils';

type OrgType = 'factory' | 'workshop' | 'team';

interface FactoryRecord {
  id: string;
  name: string;
  code: string;
  address: string;
}

interface WorkshopRecord extends FactoryRecord {
  factoryId: string;
}

interface TeamRecord extends FactoryRecord {
  workshopId: string;
}

const emit = defineEmits<{
  (e: 'back'): void;
}>();

const activeType = ref<OrgType>('factory');
const editingId = ref<string | null>(null);

const factories = ref<FactoryRecord[]>([
  { id: 'factory-1', name: '中捷一厂', code: 'F001', address: '浙江省台州市椒江区' },
  { id: 'factory-2', name: '中捷二厂', code: 'F002', address: '浙江省台州市黄岩区' },
]);

const workshops = ref<WorkshopRecord[]>([
  { id: 'workshop-1', name: '缝制一车间', code: 'W001', address: '一厂 A 区 2 楼', factoryId: 'factory-1' },
  { id: 'workshop-2', name: '装配车间', code: 'W002', address: '二厂 B 区 1 楼', factoryId: 'factory-2' },
]);

const teams = ref<TeamRecord[]>([
  { id: 'team-1', name: '一车间 A 组', code: 'T001', address: 'A 区 2 楼 01 工位', workshopId: 'workshop-1' },
  { id: 'team-2', name: '装配 B 组', code: 'T002', address: 'B 区 1 楼 03 工位', workshopId: 'workshop-2' },
]);

const form = reactive({
  name: '',
  code: '',
  address: '',
  factoryId: '',
  workshopId: '',
});

const orgTabs = [
  { id: 'factory' as const, label: '工厂', icon: Factory },
  { id: 'workshop' as const, label: '车间', icon: Building2 },
  { id: 'team' as const, label: '小组', icon: UsersRound },
];

const activeRecords = computed(() => {
  if (activeType.value === 'factory') return factories.value;
  if (activeType.value === 'workshop') return workshops.value;
  return teams.value;
});

const activeTitle = computed(() => orgTabs.find(tab => tab.id === activeType.value)?.label ?? '组织');

const getFactoryName = (factoryId: string) => factories.value.find(item => item.id === factoryId)?.name ?? '-';
const getWorkshopName = (workshopId: string) => workshops.value.find(item => item.id === workshopId)?.name ?? '-';

const resetForm = () => {
  editingId.value = null;
  form.name = '';
  form.code = '';
  form.address = '';
  form.factoryId = factories.value[0]?.id ?? '';
  form.workshopId = workshops.value[0]?.id ?? '';
};

const switchType = (type: OrgType) => {
  activeType.value = type;
  resetForm();
};

const startEdit = (record: FactoryRecord | WorkshopRecord | TeamRecord) => {
  editingId.value = record.id;
  form.name = record.name;
  form.code = record.code;
  form.address = record.address;
  form.factoryId = 'factoryId' in record ? record.factoryId : factories.value[0]?.id ?? '';
  form.workshopId = 'workshopId' in record ? record.workshopId : workshops.value[0]?.id ?? '';
};

const createId = (type: OrgType) => `${type}-${Date.now()}`;

const saveRecord = () => {
  const base = {
    name: form.name.trim(),
    code: form.code.trim(),
    address: form.address.trim(),
  };
  if (!base.name || !base.code || !base.address) return;

  if (!window.confirm(`确认是否保存${activeTitle.value}信息？`)) {
    return;
  }

  if (activeType.value === 'factory') {
    const payload: FactoryRecord = { id: editingId.value ?? createId('factory'), ...base };
    factories.value = editingId.value
      ? factories.value.map(item => item.id === editingId.value ? payload : item)
      : [...factories.value, payload];
  }

  if (activeType.value === 'workshop') {
    const payload: WorkshopRecord = {
      id: editingId.value ?? createId('workshop'),
      ...base,
      factoryId: form.factoryId || factories.value[0]?.id || '',
    };
    workshops.value = editingId.value
      ? workshops.value.map(item => item.id === editingId.value ? payload : item)
      : [...workshops.value, payload];
  }

  if (activeType.value === 'team') {
    const payload: TeamRecord = {
      id: editingId.value ?? createId('team'),
      ...base,
      workshopId: form.workshopId || workshops.value[0]?.id || '',
    };
    teams.value = editingId.value
      ? teams.value.map(item => item.id === editingId.value ? payload : item)
      : [...teams.value, payload];
  }

  resetForm();
};

const deleteRecord = (recordId: string) => {
  if (activeType.value === 'factory') {
    factories.value = factories.value.filter(item => item.id !== recordId);
    workshops.value = workshops.value.filter(item => item.factoryId !== recordId);
    const workshopIds = new Set(workshops.value.map(item => item.id));
    teams.value = teams.value.filter(item => workshopIds.has(item.workshopId));
  }
  if (activeType.value === 'workshop') {
    workshops.value = workshops.value.filter(item => item.id !== recordId);
    teams.value = teams.value.filter(item => item.workshopId !== recordId);
  }
  if (activeType.value === 'team') {
    teams.value = teams.value.filter(item => item.id !== recordId);
  }
  if (editingId.value === recordId) {
    resetForm();
  }
};

resetForm();
</script>

<template>
  <div class="org-page">
    <div class="org-header">
      <div>
        <h1>组织管理</h1>
      </div>
      <div class="org-tabs">
        <button
          v-for="tab in orgTabs"
          :key="tab.id"
          type="button"
          :class="cn('org-tab', activeType === tab.id && 'active')"
          @click="switchType(tab.id)"
        >
          <component :is="tab.icon" :size="24" :stroke-width="2.1" />
          <span>{{ tab.label }}</span>
        </button>
      </div>
      <button type="button" class="org-back" @click="emit('back')">返回系统</button>
    </div>

    <div class="org-layout">
      <section class="org-form-card">
        <div class="org-section-heading">
          <span></span>
          <h2>{{ editingId ? `修改${activeTitle}信息` : `新增${activeTitle}信息` }}</h2>
        </div>

        <label class="org-field">
          <span>名称</span>
          <input v-model="form.name" type="text" :placeholder="`请输入${activeTitle}名称`" />
        </label>
        <label class="org-field">
          <span>编号</span>
          <input v-model="form.code" type="text" :placeholder="`请输入${activeTitle}编号`" />
        </label>
        <label class="org-field">
          <span>地址</span>
          <input v-model="form.address" type="text" :placeholder="`请输入${activeTitle}地址`" />
        </label>
        <label v-if="activeType === 'workshop'" class="org-field">
          <span>所属工厂</span>
          <select v-model="form.factoryId">
            <option v-for="factory in factories" :key="factory.id" :value="factory.id">
              {{ factory.name }}
            </option>
          </select>
        </label>
        <label v-if="activeType === 'team'" class="org-field">
          <span>所属车间</span>
          <select v-model="form.workshopId">
            <option v-for="workshop in workshops" :key="workshop.id" :value="workshop.id">
              {{ workshop.name }}
            </option>
          </select>
        </label>

        <div class="org-form-actions">
          <button type="button" class="org-secondary-btn" @click="resetForm">清空</button>
          <button type="button" class="org-primary-btn" @click="saveRecord">
            <Plus :size="22" :stroke-width="2.2" />
            {{ editingId ? '保存修改' : '新增信息' }}
          </button>
        </div>
      </section>

      <section class="org-list-card">
        <div class="org-section-heading">
          <span></span>
          <h2>{{ activeTitle }}列表</h2>
        </div>

        <div class="org-table">
          <div class="org-table-row org-table-head">
            <div>名称</div>
            <div>编号</div>
            <div>地址</div>
            <div v-if="activeType === 'workshop'">所属工厂</div>
            <div v-if="activeType === 'team'">所属车间</div>
            <div>操作</div>
          </div>
          <div v-for="record in activeRecords" :key="record.id" class="org-table-row">
            <div>{{ record.name }}</div>
            <div>{{ record.code }}</div>
            <div>{{ record.address }}</div>
            <div v-if="activeType === 'workshop'">{{ getFactoryName((record as WorkshopRecord).factoryId) }}</div>
            <div v-if="activeType === 'team'">{{ getWorkshopName((record as TeamRecord).workshopId) }}</div>
            <div class="org-row-actions">
              <button type="button" @click="startEdit(record)">
                <Pencil :size="18" />
                修改
              </button>
              <button type="button" class="danger" @click="deleteRecord(record.id)">
                <Trash2 :size="18" />
                删除
              </button>
            </div>
          </div>
          <div v-if="activeRecords.length === 0" class="org-empty">
            暂无{{ activeTitle }}信息，请先新增。
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
