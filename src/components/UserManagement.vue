<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { Camera, Check, ChevronDown, CreditCard, Pencil, Plus, Search, Trash2, X } from 'lucide-vue-next';

type UserStatus = '启用' | '停用';
type MultiSelectField = 'availableSlotIds' | 'sewingDeviceIds' | 'needleIds';

interface UserRecord {
  id: string;
  username: string;
  phone: string;
  factoryId: string;
  workshopId: string;
  teamId: string;
  roleId: string;
  employeeCardId: string;
  facePhotoId: string;
  availableSlotIds: string[];
  status: UserStatus;
  createdAt: string;
  sewingDeviceIds: string[];
  needleIds: string[];
}

const factories = [
  { id: 'factory-1', name: '中捷一厂' },
  { id: 'factory-2', name: '中捷二厂' },
];

const workshops = [
  { id: 'workshop-1', name: '缝制一车间', factoryId: 'factory-1' },
  { id: 'workshop-2', name: '装配车间', factoryId: 'factory-2' },
  { id: 'workshop-3', name: '检验车间', factoryId: 'factory-1' },
];

const teams = [
  { id: 'team-1', name: '一车间 A 组', workshopId: 'workshop-1' },
  { id: 'team-2', name: '装配 B 组', workshopId: 'workshop-2' },
  { id: 'team-3', name: '检验 C 组', workshopId: 'workshop-3' },
];

const roles = [
  { id: 'role-admin', name: '管理员' },
  { id: 'role-operator', name: '操作员' },
  { id: 'role-maintainer', name: '设备维护员' },
];

const sewingDevices = [
  { id: 'device-flat-01', name: '平缝机 01' },
  { id: 'device-overlock-02', name: '包缝机 02' },
  { id: 'device-coverstitch-03', name: '绷缝机 03' },
  { id: 'device-buttonhole-04', name: '锁眼机 04' },
];

const needleSlots = [
  { id: 'slot-1', name: '1 号针位' },
  { id: 'slot-2', name: '2 号针位' },
  { id: 'slot-3', name: '3 号针位' },
  { id: 'slot-4', name: '4 号针位' },
  { id: 'slot-5', name: '5 号针位' },
  { id: 'slot-6', name: '6 号针位' },
];

const needles = [
  { id: 'needle-db-90', name: 'DBx1 9#' },
  { id: 'needle-db-110', name: 'DBx1 11#' },
  { id: 'needle-dc-90', name: 'DCx27 9#' },
  { id: 'needle-dc-140', name: 'DCx27 14#' },
];

const users = ref<UserRecord[]>([
  {
    id: 'user-admin',
    username: '系统管理员',
    phone: '13800000001',
    factoryId: 'factory-1',
    workshopId: 'workshop-1',
    teamId: 'team-1',
    roleId: 'role-admin',
    employeeCardId: 'CARD-100001',
    facePhotoId: 'FACE-user-admin',
    availableSlotIds: ['slot-1', 'slot-2', 'slot-3'],
    status: '启用',
    createdAt: '2026-06-03 10:10',
    sewingDeviceIds: ['device-flat-01', 'device-overlock-02'],
    needleIds: ['needle-db-90', 'needle-db-110'],
  },
  {
    id: 'user-operator',
    username: '一车间操作员',
    phone: '13800000002',
    factoryId: 'factory-1',
    workshopId: 'workshop-1',
    teamId: 'team-1',
    roleId: 'role-operator',
    employeeCardId: 'CARD-100002',
    facePhotoId: 'FACE-user-operator',
    availableSlotIds: ['slot-1', 'slot-4'],
    status: '启用',
    createdAt: '2026-06-03 10:20',
    sewingDeviceIds: ['device-flat-01'],
    needleIds: ['needle-db-90', 'needle-dc-90'],
  },
]);

const editingId = ref<string | null>(null);
const queryKeyword = ref('');
const queryOrganizationId = ref('');
const queryRoleId = ref('');
const queryStatus = ref('');
const openMultiSelect = ref<MultiSelectField | null>(null);
const isFaceModalOpen = ref(false);
const faceProcessing = ref(false);
let faceTimer: ReturnType<typeof setTimeout> | null = null;

const form = reactive({
  username: '',
  phone: '',
  factoryId: factories[0]?.id ?? '',
  workshopId: workshops[0]?.id ?? '',
  teamId: teams[0]?.id ?? '',
  roleId: roles[0]?.id ?? '',
  employeeCardId: '',
  facePhotoId: '',
  availableSlotIds: [needleSlots[0]?.id ?? ''].filter(Boolean),
  status: '启用' as UserStatus,
  sewingDeviceIds: [sewingDevices[0]?.id ?? ''].filter(Boolean),
  needleIds: [needles[0]?.id ?? ''].filter(Boolean),
});

const availableWorkshops = computed(() => workshops.filter(workshop => workshop.factoryId === form.factoryId));
const availableTeams = computed(() => teams.filter(team => team.workshopId === form.workshopId));

const getFactoryName = (id: string) => factories.find(item => item.id === id)?.name ?? '-';
const getWorkshopName = (id: string) => workshops.find(item => item.id === id)?.name ?? '-';
const getTeamName = (id: string) => teams.find(item => item.id === id)?.name ?? '-';
const getRoleName = (id: string) => roles.find(item => item.id === id)?.name ?? '-';
const getSlotNames = (ids: string[]) => ids.map(id => needleSlots.find(item => item.id === id)?.name).filter(Boolean).join('、') || '-';
const getDeviceNames = (ids: string[]) => ids.map(id => sewingDevices.find(item => item.id === id)?.name).filter(Boolean).join('、') || '-';
const getNeedleNames = (ids: string[]) => ids.map(id => needles.find(item => item.id === id)?.name).filter(Boolean).join('、') || '-';

const userMatchesOrganization = (user: UserRecord, organizationId: string) => {
  if (!organizationId) return true;
  return user.factoryId === organizationId || user.workshopId === organizationId || user.teamId === organizationId;
};

const multiSelectOptions = {
  availableSlotIds: needleSlots,
  sewingDeviceIds: sewingDevices,
  needleIds: needles,
};

const getMultiSelectText = (field: MultiSelectField) => {
  if (field === 'availableSlotIds') return getSlotNames(form.availableSlotIds);
  if (field === 'sewingDeviceIds') return getDeviceNames(form.sewingDeviceIds);
  return getNeedleNames(form.needleIds);
};

const filteredUsers = computed(() => {
  const keyword = queryKeyword.value.trim();
  return users.value.filter(user => {
    const matchesKeyword = !keyword || user.username.includes(keyword) || user.phone.includes(keyword);
    const matchesOrganization = userMatchesOrganization(user, queryOrganizationId.value);
    const matchesRole = !queryRoleId.value || user.roleId === queryRoleId.value;
    const matchesStatus = !queryStatus.value || user.status === queryStatus.value;
    return matchesKeyword && matchesOrganization && matchesRole && matchesStatus;
  });
});

const resetForm = () => {
  editingId.value = null;
  form.username = '';
  form.phone = '';
  form.factoryId = factories[0]?.id ?? '';
  form.workshopId = workshops.find(workshop => workshop.factoryId === form.factoryId)?.id ?? '';
  form.teamId = teams.find(team => team.workshopId === form.workshopId)?.id ?? '';
  form.roleId = roles[0]?.id ?? '';
  form.employeeCardId = '';
  form.facePhotoId = '';
  form.availableSlotIds = [needleSlots[0]?.id ?? ''].filter(Boolean);
  form.status = '启用';
  form.sewingDeviceIds = [sewingDevices[0]?.id ?? ''].filter(Boolean);
  form.needleIds = [needles[0]?.id ?? ''].filter(Boolean);
  openMultiSelect.value = null;
};

const createTimeText = () => {
  const now = new Date();
  const pad = (value: number) => value.toString().padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

const saveUser = () => {
  const username = form.username.trim();
  const phone = form.phone.trim();
  const employeeCardId = form.employeeCardId.trim();
  if (!username || !phone || !form.factoryId || !form.workshopId || !form.teamId || !form.roleId || !employeeCardId || !form.facePhotoId || form.availableSlotIds.length === 0 || form.sewingDeviceIds.length === 0 || form.needleIds.length === 0) {
    return;
  }

  if (!window.confirm('确认是否保存用户信息？')) {
    return;
  }

  if (editingId.value) {
    users.value = users.value.map(user => user.id === editingId.value
      ? {
          ...user,
          username,
          phone,
          factoryId: form.factoryId,
          workshopId: form.workshopId,
          teamId: form.teamId,
          roleId: form.roleId,
          employeeCardId,
          facePhotoId: form.facePhotoId,
          availableSlotIds: [...form.availableSlotIds],
          status: form.status,
          sewingDeviceIds: [...form.sewingDeviceIds],
          needleIds: [...form.needleIds],
        }
      : user);
  } else {
    users.value = [
      ...users.value,
      {
        id: `user-${Date.now()}`,
        username,
        phone,
        factoryId: form.factoryId,
        workshopId: form.workshopId,
        teamId: form.teamId,
        roleId: form.roleId,
        employeeCardId,
        facePhotoId: form.facePhotoId,
        availableSlotIds: [...form.availableSlotIds],
        status: form.status,
        createdAt: createTimeText(),
        sewingDeviceIds: [...form.sewingDeviceIds],
        needleIds: [...form.needleIds],
      },
    ];
  }

  resetForm();
};

const startEdit = (user: UserRecord) => {
  editingId.value = user.id;
  form.username = user.username;
  form.phone = user.phone;
  form.factoryId = user.factoryId;
  form.workshopId = user.workshopId;
  form.teamId = user.teamId;
  form.roleId = user.roleId;
  form.employeeCardId = user.employeeCardId;
  form.facePhotoId = user.facePhotoId;
  form.availableSlotIds = [...user.availableSlotIds];
  form.status = user.status;
  form.sewingDeviceIds = [...user.sewingDeviceIds];
  form.needleIds = [...user.needleIds];
  openMultiSelect.value = null;
};

const deleteUser = (userId: string) => {
  users.value = users.value.filter(user => user.id !== userId);
  if (editingId.value === userId) {
    resetForm();
  }
};

const resetQuery = () => {
  queryKeyword.value = '';
  queryOrganizationId.value = '';
  queryRoleId.value = '';
  queryStatus.value = '';
};

const onFactoryChange = () => {
  form.workshopId = workshops.find(workshop => workshop.factoryId === form.factoryId)?.id ?? '';
  form.teamId = teams.find(team => team.workshopId === form.workshopId)?.id ?? '';
};

const onWorkshopChange = () => {
  form.teamId = teams.find(team => team.workshopId === form.workshopId)?.id ?? '';
};

const simulateCardSwipe = () => {
  form.employeeCardId = `CARD-${Date.now().toString().slice(-6)}`;
};

const toggleMultiSelect = (field: MultiSelectField) => {
  openMultiSelect.value = openMultiSelect.value === field ? null : field;
};

const toggleOption = (field: MultiSelectField, optionId: string) => {
  const current = form[field];
  if (current.includes(optionId)) {
    if (current.length === 1) return;
    form[field] = current.filter(id => id !== optionId);
    return;
  }
  form[field] = [...current, optionId];
};

const openFaceRecognition = () => {
  isFaceModalOpen.value = true;
  faceProcessing.value = false;
};

const closeFaceRecognition = () => {
  isFaceModalOpen.value = false;
  faceProcessing.value = false;
  if (faceTimer) {
    clearTimeout(faceTimer);
    faceTimer = null;
  }
};

const startFaceRecognition = () => {
  if (faceProcessing.value) return;
  faceProcessing.value = true;
  if (faceTimer) {
    clearTimeout(faceTimer);
  }
  faceTimer = setTimeout(() => {
    form.facePhotoId = `FACE-${Date.now().toString().slice(-6)}`;
    faceProcessing.value = false;
    isFaceModalOpen.value = false;
    faceTimer = null;
  }, 1400);
};
</script>

<template>
  <div class="org-page">
    <div class="org-header">
      <div>
        <h1>用户管理</h1>
      </div>
    </div>

    <div class="org-layout user-layout">
      <section class="org-form-card user-form-card">
        <div class="org-section-heading">
          <span></span>
          <h2>{{ editingId ? '修改用户信息' : '新增用户信息' }}</h2>
        </div>

        <label class="org-field">
          <span>用户名</span>
          <input v-model="form.username" type="text" placeholder="请输入用户名" />
        </label>

        <label class="org-field">
          <span>手机号</span>
          <input v-model="form.phone" type="tel" placeholder="请输入手机号" />
        </label>

        <div class="org-field">
          <span>所属组织</span>
          <div class="user-org-cascade">
            <select v-model="form.factoryId" @change="onFactoryChange">
              <option v-for="factory in factories" :key="factory.id" :value="factory.id">
                {{ factory.name }}
              </option>
            </select>
            <select v-model="form.workshopId" @change="onWorkshopChange">
              <option v-for="workshop in availableWorkshops" :key="workshop.id" :value="workshop.id">
                {{ workshop.name }}
              </option>
            </select>
            <select v-model="form.teamId">
              <option v-for="team in availableTeams" :key="team.id" :value="team.id">
                {{ team.name }}
              </option>
            </select>
          </div>
        </div>

        <label class="org-field">
          <span>角色</span>
          <select v-model="form.roleId">
            <option v-for="role in roles" :key="role.id" :value="role.id">
              {{ role.name }}
            </option>
          </select>
        </label>

        <label class="org-field">
          <span>用户ID</span>
          <div class="user-card-input">
            <input v-model="form.employeeCardId" type="text" placeholder="请刷员工卡" />
            <button type="button" @click="simulateCardSwipe">
              <CreditCard :size="18" :stroke-width="2.1" />
              刷卡
            </button>
          </div>
        </label>

        <label class="org-field">
          <span>人脸照片</span>
          <button type="button" class="user-face-trigger" @click="openFaceRecognition">
            <Camera :size="22" :stroke-width="2.1" />
            <strong>{{ form.facePhotoId ? '已采集人脸照片' : '点击采集人脸照片' }}</strong>
            <small>{{ form.facePhotoId || '用于刷脸登录身份比对' }}</small>
          </button>
        </label>

        <div class="org-field user-select-field">
          <span>可取针位</span>
          <div class="user-multi-dropdown">
            <button type="button" class="user-multi-trigger" @click="toggleMultiSelect('availableSlotIds')">
              <span>{{ getMultiSelectText('availableSlotIds') }}</span>
              <ChevronDown :size="19" :stroke-width="2.1" />
            </button>
            <div v-if="openMultiSelect === 'availableSlotIds'" class="user-multi-menu">
              <button
                v-for="slot in multiSelectOptions.availableSlotIds"
                :key="slot.id"
                type="button"
                :class="['user-multi-option', form.availableSlotIds.includes(slot.id) && 'selected']"
                @click="toggleOption('availableSlotIds', slot.id)"
              >
                <Check :size="17" />
                <span>{{ slot.name }}</span>
              </button>
            </div>
          </div>
        </div>

        <div class="org-field user-select-field">
          <span>缝纫设备选择</span>
          <div class="user-multi-dropdown">
            <button type="button" class="user-multi-trigger" @click="toggleMultiSelect('sewingDeviceIds')">
              <span>{{ getMultiSelectText('sewingDeviceIds') }}</span>
              <ChevronDown :size="19" :stroke-width="2.1" />
            </button>
            <div v-if="openMultiSelect === 'sewingDeviceIds'" class="user-multi-menu">
              <button
                v-for="device in multiSelectOptions.sewingDeviceIds"
                :key="device.id"
                type="button"
                :class="['user-multi-option', form.sewingDeviceIds.includes(device.id) && 'selected']"
                @click="toggleOption('sewingDeviceIds', device.id)"
              >
                <Check :size="17" />
                <span>{{ device.name }}</span>
              </button>
            </div>
          </div>
        </div>

        <div class="org-field user-select-field">
          <span>机针选择</span>
          <div class="user-multi-dropdown">
            <button type="button" class="user-multi-trigger" @click="toggleMultiSelect('needleIds')">
              <span>{{ getMultiSelectText('needleIds') }}</span>
              <ChevronDown :size="19" :stroke-width="2.1" />
            </button>
            <div v-if="openMultiSelect === 'needleIds'" class="user-multi-menu">
              <button
                v-for="needle in multiSelectOptions.needleIds"
                :key="needle.id"
                type="button"
                :class="['user-multi-option', form.needleIds.includes(needle.id) && 'selected']"
                @click="toggleOption('needleIds', needle.id)"
              >
                <Check :size="17" />
                <span>{{ needle.name }}</span>
              </button>
            </div>
          </div>
        </div>

        <label class="org-field">
          <span>状态</span>
          <select v-model="form.status">
            <option value="启用">启用</option>
            <option value="停用">停用</option>
          </select>
        </label>

        <div class="org-form-actions">
          <button type="button" class="org-secondary-btn" @click="resetForm">清空</button>
          <button type="button" class="org-primary-btn" @click="saveUser">
            <Plus :size="22" :stroke-width="2.2" />
            {{ editingId ? '保存修改' : '新增用户' }}
          </button>
        </div>
      </section>

      <section class="org-list-card">
        <div class="role-list-head user-list-head">
          <div class="org-section-heading">
            <span></span>
            <h2>用户列表</h2>
          </div>
          <div class="user-query">
            <label class="role-search user-search">
              <Search :size="22" :stroke-width="2.1" />
              <input v-model="queryKeyword" type="text" placeholder="按用户名或手机号查询" />
            </label>
            <select v-model="queryOrganizationId">
              <option value="">全部组织</option>
              <optgroup label="工厂">
                <option v-for="factory in factories" :key="factory.id" :value="factory.id">
                  {{ factory.name }}
                </option>
              </optgroup>
              <optgroup label="车间">
                <option v-for="workshop in workshops" :key="workshop.id" :value="workshop.id">
                  {{ getFactoryName(workshop.factoryId) }} / {{ workshop.name }}
                </option>
              </optgroup>
              <optgroup label="小组">
                <option v-for="team in teams" :key="team.id" :value="team.id">
                  {{ getWorkshopName(team.workshopId) }} / {{ team.name }}
                </option>
              </optgroup>
            </select>
            <select v-model="queryRoleId">
              <option value="">全部角色</option>
              <option v-for="role in roles" :key="role.id" :value="role.id">
                {{ role.name }}
              </option>
            </select>
            <select v-model="queryStatus">
              <option value="">全部状态</option>
              <option value="启用">启用</option>
              <option value="停用">停用</option>
            </select>
            <button type="button" class="org-secondary-btn user-query-reset" @click="resetQuery">重置</button>
          </div>
        </div>

        <div class="user-table">
          <div class="user-table-row user-table-head-row">
            <div>用户名</div>
            <div>手机号</div>
            <div>所属组织</div>
            <div>角色</div>
            <div>状态</div>
            <div>配置范围</div>
            <div>创建时间</div>
            <div>操作</div>
          </div>
          <div v-for="user in filteredUsers" :key="user.id" class="user-table-row">
            <div>{{ user.username }}</div>
            <div>{{ user.phone }}</div>
            <div class="user-org-cell">
              <span>{{ getFactoryName(user.factoryId) }}</span>
              <small>{{ getWorkshopName(user.workshopId) }} / {{ getTeamName(user.teamId) }}</small>
            </div>
            <div>{{ getRoleName(user.roleId) }}</div>
            <div>
              <span :class="['user-status', user.status === '启用' ? 'enabled' : 'disabled']">{{ user.status }}</span>
            </div>
            <div class="user-scope-cell">
              <span>{{ getSlotNames(user.availableSlotIds) }}</span>
              <small>{{ getDeviceNames(user.sewingDeviceIds) }} · {{ getNeedleNames(user.needleIds) }}</small>
            </div>
            <div>{{ user.createdAt }}</div>
            <div class="org-row-actions user-actions">
              <button type="button" @click="startEdit(user)">
                <Pencil :size="18" />
                修改
              </button>
              <button type="button" class="danger" @click="deleteUser(user.id)">
                <Trash2 :size="18" />
                删除
              </button>
            </div>
          </div>
          <div v-if="filteredUsers.length === 0" class="org-empty">暂无匹配用户信息。</div>
        </div>
      </section>
    </div>

    <div v-if="isFaceModalOpen" class="role-permission-layer">
      <section class="user-face-modal">
        <div class="role-permission-header">
          <div>
            <h2>人脸识别采集</h2>
            <p>{{ form.username || '当前用户' }} · 采集后将关联到用户信息</p>
          </div>
          <button type="button" @click="closeFaceRecognition">
            <X :size="28" />
          </button>
        </div>

        <div class="user-face-body">
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
                <span>生成特征</span>
              </div>
            </div>
            <div v-else class="face-camera-text">请对准摄像头，点击开始采集</div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
