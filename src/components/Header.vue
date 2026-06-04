<script setup lang="ts">
import { computed } from 'vue';
import { Power, Search, User, Settings, BarChart3, RefreshCcw, Download, Plus, Trash2, PackageCheck, ChevronDown, Home } from 'lucide-vue-next';
import { cn } from '../lib/utils';
import type { AppView } from '../types';

interface Props {
  currentView: AppView;
  userName?: string;
}

const props = withDefaults(defineProps<Props>(), {
  userName: "管理员"
});

const emit = defineEmits<{
  (e: 'viewChange', view: AppView): void;
  (e: 'action', action: string): void;
  (e: 'login'): void;
}>();

const dashboardNavItems = [
  { label: '换针', icon: RefreshCcw, action: 'exchange', view: 'dashboard' as AppView },
  { label: '还针', icon: PackageCheck, action: 'return' },
  { label: '领针', icon: Download, action: 'dispense' },
  { label: '补充', icon: Plus, action: 'replenish' },
  { label: '清理', icon: Trash2, action: 'clear' },
  { label: '报表', icon: BarChart3, view: 'reporting' as AppView },
  { label: '系统', icon: Settings, view: 'management' as AppView },
];

const sectionNavItems = [
  { label: '首页', icon: Home, view: 'dashboard' as AppView },
  { label: '报表', icon: BarChart3, view: 'reporting' as AppView },
  { label: '系统', icon: Settings, view: 'management' as AppView },
];

const navItems = computed(() => props.currentView === 'dashboard' ? dashboardNavItems : sectionNavItems);

const isNavActive = (item: typeof dashboardNavItems[number] | typeof sectionNavItems[number]) => {
  if (props.currentView === 'dashboard') {
    return item.label === '换针';
  }
  if (item.view === 'management' && ['needle', 'needlePosition', 'organization', 'role', 'user'].includes(props.currentView)) {
    return true;
  }
  return item.view === props.currentView;
};

const handleNavClick = (item: typeof dashboardNavItems[number] | typeof sectionNavItems[number]) => {
  if (item.view) {
    emit('viewChange', item.view);
  }
  if (item.action) {
    emit('action', item.action);
  }
};
</script>

<template>
  <header :class="cn('app-header', currentView !== 'dashboard' && 'no-search')">
    <div class="brand-block">
      <div class="power-mark">
        <Power :size="44" :stroke-width="2.4" />
      </div>
      <div class="brand-title">
        <span class="brand-zoje">ZOJE</span>
        <span class="brand-name">机针云掌柜控制系统</span>
      </div>
    </div>

    <div v-if="currentView === 'dashboard'" class="header-search">
      <Search :size="22" :stroke-width="2.5" />
      <input 
        type="text" 
        placeholder="输入机针属性或针位编号搜索..."
      />
    </div>

    <nav class="top-nav">
      <button 
        v-for="item in navItems"
        :key="item.label"
        @click="handleNavClick(item)"
        :class="cn(
          'top-nav-item',
          isNavActive(item) && 'active'
        )"
      >
        <component :is="item.icon" :size="32" :stroke-width="2.3" />
        <span>{{ item.label }}</span>
      </button>
    </nav>

    <button type="button" class="user-block" @click="emit('login')">
      <div class="avatar">
        <User :size="23" />
      </div>
      <span>{{ userName }}</span>
      <ChevronDown :size="20" :stroke-width="2.7" />
    </button>
  </header>
</template>
