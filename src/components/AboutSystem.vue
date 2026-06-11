<script setup lang="ts">
import { BadgeCheck, CalendarDays, Info, MonitorCog } from 'lucide-vue-next';
import { APP_RELEASE_INFO } from '../constants';

const releaseItems = [
  {
    label: '系统版本号',
    value: APP_RELEASE_INFO.version,
    icon: BadgeCheck,
  },
  {
    label: '版本发布日期',
    value: APP_RELEASE_INFO.releaseDate,
    icon: CalendarDays,
  },
];
</script>

<template>
  <div class="org-page about-page">
    <div class="org-header about-header">
      <div>
        <h1>关于</h1>
      </div>
      <div class="face-debug-status-pill normal">
        <span></span>
        当前系统版本信息
      </div>
    </div>

    <section class="org-form-card about-card">
      <div class="about-identity">
        <div class="about-logo">
          <MonitorCog :size="64" :stroke-width="1.9" />
        </div>
        <div class="about-title">
          <span>ZOJE</span>
          <h2>{{ APP_RELEASE_INFO.name }}</h2>
        </div>
      </div>

      <div class="about-release-grid">
        <div v-for="item in releaseItems" :key="item.label" class="about-release-item">
          <div class="about-release-icon">
            <component :is="item.icon" :size="30" :stroke-width="2.1" />
          </div>
          <div>
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </div>
      </div>

      <div class="about-note">
        <Info :size="24" :stroke-width="2.1" />
        <span>版本信息用于现场运维、问题反馈与升级核对。</span>
      </div>
    </section>
  </div>
</template>
