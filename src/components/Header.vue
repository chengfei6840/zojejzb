<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { Power, Search, User, Settings, BarChart3, RefreshCcw, Download, Plus, Trash2, PackageCheck, ChevronDown, Home, Globe2, Check } from 'lucide-vue-next';
import { cn } from '../lib/utils';
import { languageOptions, messages, normalizeSupportedLocale } from '../i18n';
import type { Component } from 'vue';
import type { AppView } from '../types';
import type { LanguageCode } from '../i18n';

interface NavItem {
  label: string;
  icon: Component;
  action?: string;
  view?: AppView;
}

interface Props {
  currentView: AppView;
  activeAction?: string | null;
  language: LanguageCode;
}

const props = withDefaults(defineProps<Props>(), {
  activeAction: 'exchange',
  language: 'zh-CN',
});

const emit = defineEmits<{
  (e: 'viewChange', view: AppView): void;
  (e: 'action', action: string): void;
  (e: 'languageChange', language: LanguageCode): void;
}>();

const isLanguageMenuOpen = ref(false);
const locale = computed(() => normalizeSupportedLocale(props.language));
const t = computed(() => messages[locale.value]);

const dashboardNavItems = computed(() => [
  { label: t.value.header.nav.exchange, icon: RefreshCcw, action: 'exchange', view: 'dashboard' as AppView },
  { label: t.value.header.nav.return, icon: PackageCheck, action: 'return' },
  { label: t.value.header.nav.dispense, icon: Download, action: 'dispense' },
  { label: t.value.header.nav.replenish, icon: Plus, action: 'replenish' },
  { label: t.value.header.nav.clear, icon: Trash2, action: 'clear' },
  { label: t.value.header.nav.reporting, icon: BarChart3, view: 'reporting' as AppView },
  { label: t.value.header.nav.management, icon: Settings, view: 'management' as AppView },
]);

const sectionNavItems = computed(() => [
  { label: t.value.header.nav.home, icon: Home, view: 'dashboard' as AppView },
  { label: t.value.header.nav.reporting, icon: BarChart3, view: 'reporting' as AppView },
  { label: t.value.header.nav.management, icon: Settings, view: 'management' as AppView },
]);

const navItems = computed(() => props.currentView === 'dashboard' ? dashboardNavItems.value : sectionNavItems.value);

const isNavActive = (item: NavItem) => {
  if (props.currentView === 'dashboard') {
    return Boolean(item.action && item.action === props.activeAction);
  }
  if (
    item.view === 'management'
    && [
      'needle',
      'needlePosition',
      'organization',
      'role',
      'user',
      'componentStatus',
      'faceRecognition',
      'needleRecognition',
      'needleBoxDebugging',
      'controllerDebugging',
      'mediaSettings',
      'basicParameterSettings',
      'printSettings',
      'loginSettings',
    ].includes(props.currentView)
  ) {
    return true;
  }
  return item.view === props.currentView;
};

const handleNavClick = (item: NavItem) => {
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

const selectLanguage = (language: LanguageCode) => {
  emit('languageChange', language);
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
        <span class="brand-name">{{ t.header.brandName }}</span>
      </div>
    </div>

    <div v-if="currentView === 'dashboard'" class="header-search">
      <Search :size="22" :stroke-width="2.5" />
      <input 
        type="text" 
        :placeholder="t.header.searchPlaceholder"
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
        :aria-label="t.header.switchLanguage"
        @click.stop="toggleLanguageMenu"
      >
        <div class="avatar">
          <User :size="23" />
        </div>
        <ChevronDown :size="20" :stroke-width="2.7" />
      </button>

      <div v-if="isLanguageMenuOpen" class="language-menu" role="menu">
        <button
          v-for="option in languageOptions"
          :key="option.value"
          type="button"
          class="language-option"
          :class="language === option.value && 'selected'"
          role="menuitemradio"
          :aria-checked="language === option.value"
          @click="selectLanguage(option.value)"
        >
          <Globe2 :size="20" :stroke-width="2.2" />
          <span>{{ option.label }}</span>
          <Check v-if="language === option.value" :size="18" :stroke-width="2.8" />
        </button>
      </div>
    </div>
  </header>
</template>
