<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import {
  Camera,
  CheckCircle2,
  Crop,
  Lightbulb,
  Ruler,
  Save,
  ScanLine,
  SlidersHorizontal,
} from 'lucide-vue-next';

type Algorithm = '算法1' | '算法2' | '算法3';
type LossDisplay = '百分比' | '长度';
type Stage = 'live' | 'capturing' | 'captured' | 'cropped' | 'recognizing' | 'recognized';

const algorithms: Algorithm[] = ['算法1', '算法2', '算法3'];
const stage = ref<Stage>('live');
const isLightOn = ref(false);
const savedMessage = ref('');
const ratioMessage = ref('');

let stageTimer: number | undefined;

const form = reactive({
  algorithm: '算法1' as Algorithm,
  brokenNeedleCompensation: false,
  lossDisplay: '百分比' as LossDisplay,
  maxMissingRatio: 10,
  minError: 10,
  attributeA: 100,
  attributeB: 0,
  pixelLengthRatio: 1.15655,
  actualLength: 38,
  cropTop: 100,
  cropBottom: 60,
  cropLeft: 340,
  cropRight: 370,
});

const result = reactive({
  length: '37.95811mm',
  status: '无异常',
  maxValue: '220.0000',
  minValue: '62.0000',
});

const stageText = computed(() => {
  if (stage.value === 'capturing') return '拍照中';
  if (stage.value === 'captured') return '已拍照';
  if (stage.value === 'cropped') return '已裁剪';
  if (stage.value === 'recognizing') return '机针识别中';
  if (stage.value === 'recognized') return '识别完成';
  return '实时画面';
});

const statusTone = computed(() => {
  if (stage.value === 'capturing' || stage.value === 'recognizing') return 'running';
  if (stage.value === 'recognized') return 'normal';
  return 'idle';
});

const hasCapturedImage = computed(() => ['captured', 'cropped', 'recognizing', 'recognized'].includes(stage.value));
const hasCroppedImage = computed(() => ['cropped', 'recognizing', 'recognized'].includes(stage.value));

const resetTimer = () => {
  if (stageTimer) {
    window.clearTimeout(stageTimer);
    stageTimer = undefined;
  }
};

const capturePhoto = () => {
  resetTimer();
  stage.value = 'capturing';
  savedMessage.value = '';
  ratioMessage.value = '';
  stageTimer = window.setTimeout(() => {
    stage.value = 'captured';
  }, 900);
};

const cropNeedle = () => {
  if (!hasCapturedImage.value) {
    capturePhoto();
    stageTimer = window.setTimeout(() => {
      stage.value = 'cropped';
    }, 1100);
    return;
  }
  stage.value = 'cropped';
  savedMessage.value = '';
};

const recognizeLength = () => {
  resetTimer();
  if (!hasCroppedImage.value) {
    stage.value = 'cropped';
  }
  stage.value = 'recognizing';
  savedMessage.value = '';
  stageTimer = window.setTimeout(() => {
    const actual = Number(form.actualLength) || 38;
    result.length = `${Math.max(0, actual - 0.04189).toFixed(5)}mm`;
    result.status = form.maxMissingRatio > 35 ? '缺失率偏高' : '无异常';
    result.maxValue = (120 + form.attributeA).toFixed(4);
    result.minValue = (62 + form.attributeB * 0.15).toFixed(4);
    stage.value = 'recognized';
  }, 1300);
};

const calculateRatio = () => {
  const actualLength = Math.max(1, Number(form.actualLength) || 1);
  const simulatedPixels = form.cropLeft + form.cropRight + 12;
  form.pixelLengthRatio = Number((simulatedPixels / actualLength / 16.4).toFixed(5));
  ratioMessage.value = `已按当前截取参数计算比值：${form.pixelLengthRatio}`;
};

const saveParameters = () => {
  savedMessage.value = '参数已保存到当前调试会话';
};
</script>

<template>
  <div class="org-page needle-recognition-page">
    <div class="org-header needle-recognition-header">
      <div>
        <h1>机针识别</h1>
      </div>
      <div :class="['face-debug-status-pill', statusTone]">
        <span></span>
        {{ stageText }}
      </div>
    </div>

    <div class="needle-recognition-layout">
      <section class="org-form-card needle-recognition-settings">
        <div class="org-section-heading">
          <span></span>
          <h2>识别参数</h2>
        </div>

        <div class="needle-setting-row">
          <span>识别算法</span>
          <div class="needle-segmented">
            <button
              v-for="algorithm in algorithms"
              :key="algorithm"
              type="button"
              :class="{ active: form.algorithm === algorithm }"
              @click="form.algorithm = algorithm"
            >
              {{ algorithm }}
            </button>
          </div>
        </div>

        <div class="needle-setting-row">
          <span>断针补偿</span>
          <label class="needle-switch">
            <input v-model="form.brokenNeedleCompensation" type="checkbox" />
            <span>{{ form.brokenNeedleCompensation ? '开启' : '关闭' }}</span>
          </label>
        </div>

        <div class="needle-setting-row">
          <span>缺失率表示方式</span>
          <div class="needle-segmented">
            <button type="button" :class="{ active: form.lossDisplay === '百分比' }" @click="form.lossDisplay = '百分比'">百分比</button>
            <button type="button" :class="{ active: form.lossDisplay === '长度' }" @click="form.lossDisplay = '长度'">长度</button>
          </div>
        </div>

        <label class="needle-range-field">
          <span>允许的最大缺失比例 <strong>{{ form.maxMissingRatio }}{{ form.lossDisplay === '百分比' ? '%' : 'mm' }}</strong></span>
          <input v-model.number="form.maxMissingRatio" type="range" min="0" max="100" />
        </label>

        <label class="org-field needle-inline-unit">
          <span>系统内置的最小误差</span>
          <div>
            <input v-model.number="form.minError" type="number" min="0" />
            <strong>0.1mm</strong>
          </div>
        </label>

        <label class="needle-range-field">
          <span>属性值 A <strong>{{ form.attributeA }}</strong></span>
          <input v-model.number="form.attributeA" type="range" min="0" max="100" />
        </label>

        <label class="needle-range-field">
          <span>属性值 B <strong>{{ form.attributeB }}</strong></span>
          <input v-model.number="form.attributeB" type="range" min="0" max="100" />
        </label>

        <label class="org-field">
          <span>像素数与长度比值</span>
          <input v-model.number="form.pixelLengthRatio" type="number" step="0.00001" />
        </label>

        <div class="needle-crop-grid">
          <label class="org-field">
            <span>机针实际长度</span>
            <input v-model.number="form.actualLength" type="number" min="0" step="0.1" />
          </label>
          <label class="org-field">
            <span>中心点上方截取长度</span>
            <input v-model.number="form.cropTop" type="number" min="0" />
          </label>
          <label class="org-field">
            <span>中心点下方截取长度设定</span>
            <input v-model.number="form.cropBottom" type="number" min="0" />
          </label>
          <label class="org-field">
            <span>中心点左边截取长度</span>
            <input v-model.number="form.cropLeft" type="number" min="0" />
          </label>
          <label class="org-field">
            <span>中心点右边截取长度设定</span>
            <input v-model.number="form.cropRight" type="number" min="0" />
          </label>
        </div>
      </section>

      <section class="org-list-card needle-recognition-workbench">
        <div class="role-list-head needle-recognition-workbench-head">
          <div class="org-section-heading">
            <span></span>
            <h2>针仓视频画面</h2>
          </div>
          <div class="needle-recognition-light">
            <span :class="{ active: isLightOn }"></span>
            {{ isLightOn ? '废针仓灯已打开' : '废针仓灯已关闭' }}
          </div>
        </div>

        <div :class="['needle-video-panel', isLightOn && 'light-on', hasCapturedImage && 'snapshot']">
          <div class="needle-chamber-plate">
            <span></span>
            <strong>废针仓</strong>
          </div>
          <div class="needle-video-rail"></div>
          <div class="needle-video-needle"></div>
          <div class="needle-video-tip"></div>
          <div v-if="stage === 'capturing' || stage === 'recognizing'" class="needle-processing-layer">
            <ScanLine :size="54" :stroke-width="2.1" />
            <strong>{{ stageText }}</strong>
          </div>
        </div>

        <div class="needle-preview-grid">
          <div class="needle-preview-card">
            <span>拍照结果</span>
            <div :class="['needle-preview-image', hasCapturedImage && 'ready']">
              <div v-if="hasCapturedImage" class="needle-preview-needle"></div>
              <small v-else>未拍照</small>
            </div>
          </div>
          <div class="needle-preview-card">
            <span>裁剪结果</span>
            <div :class="['needle-preview-image cropped', hasCroppedImage && 'ready']">
              <div v-if="hasCroppedImage" class="needle-preview-needle"></div>
              <small v-else>未裁剪</small>
            </div>
          </div>
        </div>

        <div class="needle-debug-actions">
          <button type="button" class="org-secondary-btn needle-debug-btn" @click="isLightOn = !isLightOn">
            <Lightbulb :size="20" :stroke-width="2.1" />
            {{ isLightOn ? '关闭废针仓灯' : '打开废针仓灯' }}
          </button>
          <button type="button" class="org-primary-btn needle-debug-btn" @click="capturePhoto">
            <Camera :size="20" :stroke-width="2.1" />
            拍照
          </button>
          <button type="button" class="org-primary-btn needle-debug-btn" @click="cropNeedle">
            <Crop :size="20" :stroke-width="2.1" />
            裁剪
          </button>
          <button type="button" class="org-primary-btn needle-debug-btn" @click="recognizeLength">
            <Ruler :size="20" :stroke-width="2.1" />
            长度识别
          </button>
          <button type="button" class="org-secondary-btn needle-debug-btn" @click="calculateRatio">
            <SlidersHorizontal :size="20" :stroke-width="2.1" />
            获取比值
          </button>
          <button type="button" class="org-primary-btn needle-debug-btn" @click="saveParameters">
            <Save :size="20" :stroke-width="2.1" />
            保存参数
          </button>
        </div>
      </section>

      <aside class="org-form-card needle-recognition-result">
        <div class="org-section-heading">
          <span></span>
          <h2>识别结果</h2>
        </div>
        <div class="needle-result-hero">
          <CheckCircle2 :size="54" :stroke-width="2" />
          <strong>{{ stage === 'recognized' ? '识别完成' : '等待识别' }}</strong>
          <p>{{ stage === 'recognized' ? '当前机针长度和异常状态已完成模拟识别。' : '请先拍照、裁剪，再执行长度识别。' }}</p>
        </div>
        <div class="needle-result-list">
          <div>
            <span>机针长度</span>
            <strong>{{ stage === 'recognized' ? result.length : '-' }}</strong>
          </div>
          <div>
            <span>机针异常</span>
            <strong>{{ stage === 'recognized' ? result.status : '-' }}</strong>
          </div>
          <div>
            <span>属性最大值</span>
            <strong>{{ stage === 'recognized' ? result.maxValue : '-' }}</strong>
          </div>
          <div>
            <span>属性最小值</span>
            <strong>{{ stage === 'recognized' ? result.minValue : '-' }}</strong>
          </div>
        </div>
        <p v-if="ratioMessage" class="needle-feedback">{{ ratioMessage }}</p>
        <p v-if="savedMessage" class="needle-feedback">{{ savedMessage }}</p>
      </aside>
    </div>
  </div>
</template>
