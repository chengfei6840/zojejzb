<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { KeyRound, Pencil, Plus, Search, ShieldCheck, Trash2, X } from 'lucide-vue-next';

interface RoleRecord {
  id: string;
  name: string;
  remark: string;
  createdAt: string;
  permissions: string[];
}

const permissionGroups = [
  { title: '首页操作', items: ['换针', '还针', '领针', '补充', '清理'] },
  { title: '报表权限', items: ['查看报表', '导出报表'] },
  { title: '数据维护', items: ['机针管理', '针位管理', '组织管理', '角色管理', '用户管理'] },
  { title: '设备调试', items: ['部件状态', '人脸识别', '机针识别', '针盒调试', '控制器调试', '媒体设置'] },
  { title: '系统设置', items: ['语言设置', '基础参数设置', '打印设置', '登陆设置', '异常针碎片丢失处理', '换针时间设置'] },
];

const allPermissions = permissionGroups.flatMap(group => group.items);

const roles = ref<RoleRecord[]>([
  {
    id: 'role-admin',
    name: '管理员',
    remark: '拥有系统全部功能权限',
    createdAt: '2026-06-03 09:30',
    permissions: [...allPermissions],
  },
  {
    id: 'role-operator',
    name: '操作员',
    remark: '负责换针、领针、还针等日常操作',
    createdAt: '2026-06-03 09:45',
    permissions: ['换针', '还针', '领针', '查看报表'],
  },
]);

const queryName = ref('');
const editingId = ref<string | null>(null);
const permissionRoleId = ref<string | null>(null);
const permissionDraft = ref<string[]>([]);

const form = reactive({
  name: '',
  remark: '',
});

const filteredRoles = computed(() => {
  const keyword = queryName.value.trim();
  if (!keyword) return roles.value;
  return roles.value.filter(role => role.name.includes(keyword));
});

const permissionRole = computed(() => roles.value.find(role => role.id === permissionRoleId.value) ?? null);

const resetForm = () => {
  editingId.value = null;
  form.name = '';
  form.remark = '';
};

const createTimeText = () => {
  const now = new Date();
  const pad = (value: number) => value.toString().padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

const saveRole = () => {
  const name = form.name.trim();
  const remark = form.remark.trim();
  if (!name) return;

  if (!window.confirm('确认是否保存角色信息？')) {
    return;
  }

  if (editingId.value) {
    roles.value = roles.value.map(role => role.id === editingId.value ? { ...role, name, remark } : role);
  } else {
    roles.value = [
      ...roles.value,
      {
        id: `role-${Date.now()}`,
        name,
        remark,
        createdAt: createTimeText(),
        permissions: [],
      },
    ];
  }

  resetForm();
};

const startEdit = (role: RoleRecord) => {
  editingId.value = role.id;
  form.name = role.name;
  form.remark = role.remark;
};

const deleteRole = (roleId: string) => {
  roles.value = roles.value.filter(role => role.id !== roleId);
  if (editingId.value === roleId) {
    resetForm();
  }
  if (permissionRoleId.value === roleId) {
    permissionRoleId.value = null;
    permissionDraft.value = [];
  }
};

const openPermission = (role: RoleRecord) => {
  permissionRoleId.value = role.id;
  permissionDraft.value = [...role.permissions];
};

const closePermission = () => {
  permissionRoleId.value = null;
  permissionDraft.value = [];
};

const togglePermission = (permission: string) => {
  permissionDraft.value = permissionDraft.value.includes(permission)
    ? permissionDraft.value.filter(item => item !== permission)
    : [...permissionDraft.value, permission];
};

const savePermission = () => {
  if (!permissionRoleId.value) return;
  roles.value = roles.value.map(role => role.id === permissionRoleId.value
    ? { ...role, permissions: [...permissionDraft.value] }
    : role);
  closePermission();
};
</script>

<template>
  <div class="org-page">
    <div class="org-header">
      <div>
        <h1>角色管理</h1>
      </div>
    </div>

    <div class="org-layout role-layout">
      <section class="org-form-card">
        <div class="org-section-heading">
          <span></span>
          <h2>{{ editingId ? '修改角色信息' : '新增角色信息' }}</h2>
        </div>

        <label class="org-field">
          <span>角色名称</span>
          <input v-model="form.name" type="text" placeholder="请输入角色名称" />
        </label>

        <label class="org-field">
          <span>备注</span>
          <textarea v-model="form.remark" class="role-textarea" placeholder="请输入角色备注"></textarea>
        </label>

        <div class="org-form-actions">
          <button type="button" class="org-secondary-btn" @click="resetForm">清空</button>
          <button type="button" class="org-primary-btn" @click="saveRole">
            <Plus :size="22" :stroke-width="2.2" />
            {{ editingId ? '保存修改' : '新增角色' }}
          </button>
        </div>
      </section>

      <section class="org-list-card">
        <div class="role-list-head">
          <div class="org-section-heading">
            <span></span>
            <h2>角色列表</h2>
          </div>
          <label class="role-search">
            <Search :size="22" :stroke-width="2.1" />
            <input v-model="queryName" type="text" placeholder="按角色名称查询" />
          </label>
        </div>

        <div class="role-table">
          <div class="role-table-row role-table-head-row">
            <div>名称</div>
            <div>备注</div>
            <div>创建时间</div>
            <div>操作</div>
          </div>
          <div v-for="role in filteredRoles" :key="role.id" class="role-table-row">
            <div>{{ role.name }}</div>
            <div>{{ role.remark || '-' }}</div>
            <div>{{ role.createdAt }}</div>
            <div class="org-row-actions role-actions">
              <button type="button" @click="startEdit(role)">
                <Pencil :size="18" />
                修改
              </button>
              <button type="button" class="danger" @click="deleteRole(role.id)">
                <Trash2 :size="18" />
                删除
              </button>
              <button type="button" @click="openPermission(role)">
                <KeyRound :size="18" />
                分配权限
              </button>
            </div>
          </div>
          <div v-if="filteredRoles.length === 0" class="org-empty">暂无匹配角色信息。</div>
        </div>
      </section>
    </div>

    <div v-if="permissionRole" class="role-permission-layer">
      <div class="role-permission-card">
        <div class="role-permission-header">
          <div>
            <h2>分配权限</h2>
            <p>{{ permissionRole.name }} · 选择该角色可使用的系统功能</p>
          </div>
          <button type="button" @click="closePermission">
            <X :size="28" />
          </button>
        </div>

        <div class="role-permission-body">
          <section v-for="group in permissionGroups" :key="group.title" class="role-permission-group">
            <h3>{{ group.title }}</h3>
            <div class="role-permission-options">
              <button
                v-for="permission in group.items"
                :key="permission"
                type="button"
                :class="['permission-option', permissionDraft.includes(permission) && 'checked']"
                @click="togglePermission(permission)"
              >
                <ShieldCheck :size="19" />
                <span>{{ permission }}</span>
              </button>
            </div>
          </section>
        </div>

        <div class="role-permission-actions">
          <button type="button" class="org-secondary-btn" @click="closePermission">取消</button>
          <button type="button" class="org-primary-btn" @click="savePermission">保存权限</button>
        </div>
      </div>
    </div>
  </div>
</template>
