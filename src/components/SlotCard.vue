<script setup lang="ts">
import { computed } from 'vue';
import type { NeedleSlot } from '../types';
import { cn } from '../lib/utils';
import { Package } from 'lucide-vue-next';

interface Props {
  slot: NeedleSlot;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'click', slot: NeedleSlot): void;
}>();

const displayNumber = computed(() => Number.parseInt(props.slot.number, 10) || 0);
</script>

<template>
  <div
    @click="emit('click', slot)"
    :class="cn(
      'relative rounded-2xl border border-gray-100 bg-white px-2.5 py-2.5 cursor-pointer transition-all industrial-shadow h-full flex flex-col justify-center hover:-translate-y-0.5'
    )"
  >
    <div class="absolute top-2 right-2 w-4 h-4 rounded-full bg-[var(--color-zoje-green)] text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white">
      {{ displayNumber }}
    </div>

    <div v-if="slot.needleType" class="flex-1 flex items-center gap-2 min-h-0 py-0.5">
      <div class="flex-1 text-[10px] leading-[1.2] text-gray-800 space-y-0.5">
        <p class="whitespace-nowrap overflow-hidden text-ellipsis"><span class="text-gray-500">机针型号：</span><span class="font-semibold">{{ slot.needleType }}</span></p>
        <p class="whitespace-nowrap overflow-hidden text-ellipsis"><span class="text-gray-500">针号：</span><span class="font-semibold">{{ slot.needleNo }}</span></p>
        <p class="whitespace-nowrap overflow-hidden text-ellipsis"><span class="text-gray-500">针尖：</span><span class="font-semibold">{{ slot.needleTip }}</span></p>
        <p class="whitespace-nowrap overflow-hidden text-ellipsis"><span class="text-gray-500">机针名称：</span><span class="font-semibold">{{ slot.needleName || slot.model }}</span></p>
        <p class="whitespace-nowrap overflow-hidden text-ellipsis"><span class="text-gray-500">机针用途：</span><span class="font-semibold">{{ slot.usage }}</span></p>
        <p class="whitespace-nowrap overflow-hidden text-ellipsis"><span class="text-gray-500">品牌：</span><span class="font-semibold">{{ slot.brand }}</span></p>
      </div>
      <img
        v-if="slot.image"
        :src="slot.image"
        alt="Sewing Machine"
        class="w-[102px] h-[60px] object-contain flex-shrink-0 opacity-95"
      />
    </div>
    <div v-else class="flex-1 flex flex-col items-center justify-center opacity-30 my-0">
      <Package :size="18" class="text-gray-400" />
      <span class="text-[8px] font-bold text-gray-400 mt-1 uppercase">Empty</span>
    </div>

    <div class="absolute right-2.5 bottom-2 text-[10px] font-semibold text-gray-500">
      库存：20
    </div>

  </div>
</template>
