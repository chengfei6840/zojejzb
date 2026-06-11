<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import {
  FileVideo,
  Link2,
  Play,
  Radio,
  Save,
  Upload,
  Volume2,
} from 'lucide-vue-next';

type StatusTone = 'idle' | 'running' | 'normal' | 'fault';
type VideoType = 'default' | 'local' | 'network';

const localVideoInputRef = ref<HTMLInputElement | null>(null);
const statusMessage = ref('媒体设置待机，可调整语音与首页视频参数。');
const statusTone = ref<StatusTone>('idle');

const voiceSpeeds = [0.75, 1, 1.25, 1.5, 1.75, 2];

const voiceForm = reactive({
  enabled: true,
  speed: 1,
  volume: 80,
});

const videoForm = reactive({
  enabled: true,
  type: 'default' as VideoType,
  volume: 60,
  localVideoName: '未选择本地视频',
  localVideoPath: '',
  networkUrl: '',
});

const videoTypeOptions: Array<{ label: string; value: VideoType }> = [
  { label: '默认视频', value: 'default' },
  { label: '本地视频', value: 'local' },
  { label: '网络视频', value: 'network' },
];

const activeVideoSource = computed(() => {
  if (!videoForm.enabled) return '首页视频已停用';
  if (videoForm.type === 'default') return '系统默认宣传视频';
  if (videoForm.type === 'local') return videoForm.localVideoName;
  return videoForm.networkUrl.trim() || '未设置网络视频地址';
});

const videoSourceTone = computed(() => {
  if (!videoForm.enabled) return 'stopped';
  if (videoForm.type === 'local' && !videoForm.localVideoPath) return 'warning';
  if (videoForm.type === 'network' && !videoForm.networkUrl.trim()) return 'warning';
  return 'ready';
});

const setStatus = (message: string, tone: StatusTone = 'running') => {
  statusMessage.value = message;
  statusTone.value = tone;
};

const applyVoiceSettings = () => {
  setStatus(
    voiceForm.enabled
      ? `语音设置已应用：语速 ${voiceForm.speed}x，音量 ${voiceForm.volume}。`
      : '语音播放已停止。',
    'normal',
  );
};

const testVoice = () => {
  setStatus(
    voiceForm.enabled
      ? `正在按 ${voiceForm.speed}x 语速、${voiceForm.volume} 音量测试语音播报。`
      : '语音播放已停用，无法执行测试。',
    voiceForm.enabled ? 'running' : 'fault',
  );
};

const applyVideoSettings = () => {
  if (videoForm.enabled && videoForm.type === 'local' && !videoForm.localVideoPath) {
    setStatus('请选择本地视频后再应用。', 'fault');
    return;
  }
  if (videoForm.enabled && videoForm.type === 'network' && !videoForm.networkUrl.trim()) {
    setStatus('请输入网络视频网址后再应用。', 'fault');
    return;
  }
  setStatus(
    videoForm.enabled
      ? `首页视频设置已应用：${activeVideoSource.value}，音量 ${videoForm.volume}。`
      : '首页视频播放已停止。',
    'normal',
  );
};

const testVideo = () => {
  if (!videoForm.enabled) {
    setStatus('视频播放已停用，无法执行测试。', 'fault');
    return;
  }
  if (videoSourceTone.value === 'warning') {
    setStatus(videoForm.type === 'local' ? '请选择本地视频后再测试。' : '请输入网络视频网址后再测试。', 'fault');
    return;
  }
  setStatus(`正在测试首页视频：${activeVideoSource.value}。`, 'running');
};

const onLocalVideoChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  videoForm.localVideoName = file.name;
  videoForm.localVideoPath = file.name;
  videoForm.type = 'local';
  setStatus(`已选择本地视频：${file.name}。`);
};
</script>

<template>
  <div class="org-page media-settings-page">
    <div class="org-header media-settings-header">
      <div>
        <h1>媒体设置</h1>
      </div>
      <div :class="['face-debug-status-pill', statusTone]">
        <span></span>
        {{ statusMessage }}
      </div>
    </div>

    <div class="media-settings-layout">
      <section class="org-form-card media-settings-card">
        <div class="role-list-head media-settings-section-head">
          <div class="org-section-heading">
            <span></span>
            <h2>音量设置</h2>
          </div>
          <div class="media-settings-actions">
            <button type="button" class="org-secondary-btn media-settings-small-btn" @click="testVoice">
              <Play :size="18" :stroke-width="2.1" />
              测试
            </button>
            <button type="button" class="org-primary-btn media-settings-small-btn" @click="applyVoiceSettings">
              <Save :size="18" :stroke-width="2.1" />
              应用
            </button>
          </div>
        </div>

        <div class="media-option-row">
          <div class="media-option-label">
            <Volume2 :size="24" :stroke-width="2.1" />
            语音播放
          </div>
          <div class="media-segmented">
            <button type="button" :class="{ active: voiceForm.enabled }" @click="voiceForm.enabled = true">启用</button>
            <button type="button" :class="{ active: !voiceForm.enabled }" @click="voiceForm.enabled = false">停止</button>
          </div>
        </div>

        <label class="media-range-field">
          <span>播报语速</span>
          <select v-model.number="voiceForm.speed">
            <option v-for="speed in voiceSpeeds" :key="speed" :value="speed">{{ speed }}x</option>
          </select>
        </label>

        <label class="media-range-field">
          <span>语音音量</span>
          <div class="media-slider-control">
            <input v-model.number="voiceForm.volume" type="range" min="0" max="100" step="1" />
            <strong>{{ voiceForm.volume }}</strong>
          </div>
        </label>
      </section>

      <section class="org-form-card media-settings-card">
        <div class="role-list-head media-settings-section-head">
          <div class="org-section-heading">
            <span></span>
            <h2>首页视频设置</h2>
          </div>
          <div class="media-settings-actions">
            <button type="button" class="org-secondary-btn media-settings-small-btn" @click="testVideo">
              <Play :size="18" :stroke-width="2.1" />
              测试
            </button>
            <button type="button" class="org-primary-btn media-settings-small-btn" @click="applyVideoSettings">
              <Save :size="18" :stroke-width="2.1" />
              应用
            </button>
          </div>
        </div>

        <div class="media-option-row">
          <div class="media-option-label">
            <FileVideo :size="24" :stroke-width="2.1" />
            视频播放
          </div>
          <div class="media-segmented">
            <button type="button" :class="{ active: videoForm.enabled }" @click="videoForm.enabled = true">启用</button>
            <button type="button" :class="{ active: !videoForm.enabled }" @click="videoForm.enabled = false">停止</button>
          </div>
        </div>

        <div class="media-video-types">
          <button
            v-for="option in videoTypeOptions"
            :key="option.value"
            type="button"
            :class="{ active: videoForm.type === option.value }"
            @click="videoForm.type = option.value"
          >
            <Radio :size="18" :stroke-width="2.1" />
            {{ option.label }}
          </button>
        </div>

        <label class="media-range-field">
          <span>视频音量</span>
          <div class="media-slider-control">
            <input v-model.number="videoForm.volume" type="range" min="0" max="100" step="1" />
            <strong>{{ videoForm.volume }}</strong>
          </div>
        </label>

        <div class="media-source-panel">
          <div :class="['media-source-state', videoSourceTone]">
            <span>当前视频源</span>
            <strong>{{ activeVideoSource }}</strong>
          </div>

          <div class="media-file-row">
            <label class="media-source-field">
              <span>本地视频</span>
              <input :value="videoForm.localVideoName" type="text" readonly />
            </label>
            <button type="button" class="org-secondary-btn media-pick-btn" @click="localVideoInputRef?.click()">
              <Upload :size="18" :stroke-width="2.1" />
              选择
            </button>
            <input ref="localVideoInputRef" class="hidden-file-input" type="file" accept="video/*" @change="onLocalVideoChange" />
          </div>

          <label class="media-source-field">
            <span>
              <Link2 :size="18" :stroke-width="2.1" />
              网络视频
            </span>
            <input v-model.trim="videoForm.networkUrl" type="url" placeholder="请输入网络视频地址" @focus="videoForm.type = 'network'" />
          </label>
        </div>
      </section>
    </div>
  </div>
</template>
