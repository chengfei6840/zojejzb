<script setup lang="ts">
import { Power, Search, User, Home, Settings, BarChart3, RefreshCcw, Download, Inbox, Plus, Trash2 } from 'lucide-vue-next';
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
}>();
</script>

<template>
  <header class="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-6 industrial-shadow sticky top-0 z-50">
    <div class="flex items-center gap-6">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-full bg-[var(--color-zoje-green)] flex items-center justify-center text-white cursor-pointer hover:opacity-90 transition-opacity">
          <Power :size="28" />
        </div>
        <div class="h-8 w-[2px] bg-gray-200 hidden md:block" />
        <div class="flex flex-col">
          <span class="text-[var(--color-zoje-green)] font-black text-3xl tracking-tighter leading-none">ZOJE</span>
        </div>
      </div>

      <div class="flex items-center bg-gray-100 rounded-lg px-3 py-1.5 border border-gray-200 ml-4 group focus-within:border-[var(--color-zoje-green)] transition-all flex-1 max-w-xl">
        <input 
          type="text" 
          placeholder="输入机针属性或针位编号搜索" 
          class="bg-transparent outline-none text-xs w-full placeholder:text-gray-400"
        />
        <Search :size="18" class="text-gray-400 group-focus-within:text-[var(--color-zoje-green)] transition-colors flex-shrink-0" />
      </div>
    </div>

    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2">
        <button 
          @click="emit('viewChange', 'dashboard')"
          :class="cn(
            'flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-all',
            currentView === 'dashboard'
              ? 'bg-white text-[var(--color-zoje-green)] shadow-inner border border-gray-100' 
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          )"
        >
          <Home :size="20" />
          <span class="text-[10px] font-bold mt-1 uppercase tracking-wider">首页</span>
        </button>
        <button 
          @click="emit('viewChange', 'management')"
          :class="cn(
            'flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-all',
            currentView === 'management'
              ? 'bg-white text-[var(--color-zoje-green)] shadow-inner border border-gray-100' 
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          )"
        >
          <Settings :size="20" />
          <span class="text-[10px] font-bold mt-1 uppercase tracking-wider">系统</span>
        </button>
        <button 
          @click="emit('viewChange', 'reporting')"
          :class="cn(
            'flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-all',
            currentView === 'reporting'
              ? 'bg-white text-[var(--color-zoje-green)] shadow-inner border border-gray-100' 
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          )"
        >
          <BarChart3 :size="20" />
          <span class="text-[10px] font-bold mt-1 uppercase tracking-wider">报表</span>
        </button>

        <template v-if="currentView === 'dashboard'">
          <div class="w-[1px] h-8 bg-gray-200 mx-1" />

          <button 
            @click="emit('action', 'exchange')"
            class="flex flex-col items-center justify-center w-20 h-16 rounded-xl bg-[var(--color-zoje-green)] text-white hover:brightness-110 active:scale-95 transition-all shadow-sm"
          >
            <RefreshCcw :size="20" />
            <span class="text-[10px] font-bold mt-1 uppercase tracking-wider">换针</span>
          </button>
          <button 
            @click="emit('action', 'return')"
            class="flex flex-col items-center justify-center w-20 h-16 rounded-xl bg-[var(--color-zoje-green)] text-white hover:brightness-110 active:scale-95 transition-all shadow-sm"
          >
            <Download :size="20" />
            <span class="text-[10px] font-bold mt-1 uppercase tracking-wider">还针</span>
          </button>
          <button 
            @click="emit('action', 'dispense')"
            class="flex flex-col items-center justify-center w-20 h-16 rounded-xl bg-[var(--color-zoje-green)] text-white hover:brightness-110 active:scale-95 transition-all shadow-sm"
          >
            <Inbox :size="20" />
            <span class="text-[10px] font-bold mt-1 uppercase tracking-wider">领针</span>
          </button>
          <button 
            @click="emit('action', 'replenish')"
            class="flex flex-col items-center justify-center w-20 h-16 rounded-xl bg-[var(--color-zoje-green)] text-white hover:brightness-110 active:scale-95 transition-all shadow-sm"
          >
            <Plus :size="20" />
            <span class="text-[10px] font-bold mt-1 uppercase tracking-wider">补充</span>
          </button>
          <button 
            @click="emit('action', 'clear')"
            class="flex flex-col items-center justify-center w-20 h-16 rounded-xl bg-[var(--color-zoje-green)] text-white hover:brightness-110 active:scale-95 transition-all shadow-sm"
          >
            <Trash2 :size="20" />
            <span class="text-[10px] font-bold mt-1 uppercase tracking-wider">清理</span>
          </button>
        </template>
      </div>

      <div class="flex items-center gap-3 ml-4 py-1.5 px-3 bg-gray-50 rounded-full border border-gray-100">
        <div class="w-8 h-8 rounded-full bg-[var(--color-zoje-green)] flex items-center justify-center text-white">
          <User :size="18" />
        </div>
        <span class="text-sm font-semibold text-gray-700">{{ userName }}</span>
      </div>
    </div>
  </header>
</template>
