<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { Power, Search, User, Settings, BarChart3, RefreshCcw, Download, Plus, Trash2, PackageCheck, ChevronDown, Home, Globe2, Check } from 'lucide-vue-next';
import { cn } from '../lib/utils';
import type { AppView } from '../types';

interface Props {
  currentView: AppView;
  activeAction?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  activeAction: 'exchange',
});

const emit = defineEmits<{
  (e: 'viewChange', view: AppView): void;
  (e: 'action', action: string): void;
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
const isLanguageMenuOpen = ref(false);
const selectedLanguage = ref('zh-CN');

const languageOptions = [
  { label: '简体中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' },
];

const isNavActive = (item: typeof dashboardNavItems[number] | typeof sectionNavItems[number]) => {
  if (props.currentView === 'dashboard') {
    return Boolean(item.action && item.action === props.activeAction);
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

const toggleLanguageMenu = () => {
  isLanguageMenuOpen.value = !isLanguageMenuOpen.value;
};

const selectLanguage = (language: string) => {
  selectedLanguage.value = language;
  isLanguageMenuOpen.value = false;
};

const closeLanguageMenu = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null;
  if (!target?.closest('.language-switcher')) {
    isLanguageMenuOpen.value = false;
  }
};

onMounted(() => {
  window.addEventListener('click', closeLanguageMenu);
});

onBeforeUnmount(() => {
  window.removeEventListener('click', closeLanguageMenu);
});
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

    <div class="language-switcher">
      <button 
        type="button" 
        class="user-block" 
        :class="isLanguageMenuOpen && 'open'"
        :aria-expanded="isLanguageMenuOpen"
        aria-haspopup="menu"
        aria-label="切换语言"
        @click.stop="toggleLanguageMenu"
      >
        <div class="avatar">
          <User :size="23" />
        </div>
        <ChevronDown :size="20" :stroke-width="2.7" />
      </button>

      <div v-if="isLanguageMenuOpen" class="language-menu" role="menu">
        <button
          v-for="language in languageOptions"
          :key="language.value"
          type="button"
          class="language-option"
          :class="selectedLanguage === language.value && 'selected'"
          role="menuitemradio"
          :aria-checked="selectedLanguage === language.value"
          @click="selectLanguage(language.value)"
        >
          <Globe2 :size="20" :stroke-width="2.2" />
          <span>{{ language.label }}</span>
          <Check v-if="selectedLanguage === language.value" :size="18" :stroke-width="2.8" />
        </button>
      </div>
    </div>
  </header>
</template>
