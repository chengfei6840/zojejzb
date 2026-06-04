<script setup lang="ts">
import { computed } from 'vue';
import type { NeedleSlot } from '../types';
import { cn } from '../lib/utils';

interface Props {
  slot: NeedleSlot;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'click', slot: NeedleSlot): void;
}>();

const displayNumber = computed(() => Number.parseInt(props.slot.number, 10) || 0);
const countTone = computed(() => {
  if (props.slot.count === 0) return 'red';
  if (props.slot.count <= 9) return 'amber';
  return 'green';
});
</script>

<template>
  <div
    @click="emit('click', slot)"
    :class="cn(
      'slot-card',
      displayNumber === 1 && 'selected'
    )"
  >
    <div class="slot-badge">
      {{ displayNumber }}
    </div>

    <div class="slot-content">
      <div class="slot-info">
        <div class="slot-left-text">
          <div>{{ slot.needleType }}</div>
          <div>{{ slot.needleNo }}</div>
        </div>
        <div class="slot-right-text">
          <div>{{ slot.model }}</div>
          <div>{{ slot.brand }}</div>
        </div>
      </div>

      <div class="slot-visual-row">
        <img
          v-if="slot.image"
          :src="slot.image"
          alt="Sewing Machine"
          class="machine-image"
        />

        <div class="slot-count">
          <span>余量</span>
          <strong :class="countTone">{{ slot.count }}</strong>
        </div>
      </div>
    </div>
  </div>
</template>
