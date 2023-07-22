<script setup lang="ts">
import type { LiuFileStore } from '~/types';
import type { PropType } from 'vue';
import { usePrettyFile } from './tools/usePrettyFile';

const props = defineProps({
  file: {
    type: Object as PropType<LiuFileStore>
  }
})

const {
  iconType,
  sizeStr,
  onTapFile,
} = usePrettyFile(props)


</script>
<template>

  <div v-if="file" class="pf-container">
    <div v-if="iconType" class="pf-icon-box" @click.stop="onTapFile">
      <svg-icon :name="'files-' + iconType"
        :cover-fill-stroke="false"
        class="pf-svg-icon"
      ></svg-icon>
    </div>

    <!-- 文件信息 -->
    <div class="pf-info" @click.stop="onTapFile">
      <!-- 文件标题 -->
      <div class="pf-title">
        <span>{{ file.name }}</span>
      </div>
      <!-- 文件大小 -->
      <div v-if="sizeStr" class="pf-bd">
        <span>{{ sizeStr }}</span>
      </div>
    </div>
  
  </div>

</template>
<style lang="scss" scoped>

.pf-container {
  max-width: 100%;
  position: relative;
  box-sizing: border-box;
  padding: 8px 4px 8px 0px;
  border-radius: 8px;
  overflow: hidden;
  margin-block-end: 8px;
  display: flex;
  transition: .15s;
  cursor: pointer;
}

.pf-icon-box {
  width: 42px;
  height: 42px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-block-start: 2px;
  padding-inline-end: 8px;
  flex: none;

  .pf-svg-icon {
    width: 100%;
    height: 100%;
  }
}

.pf-info {
  min-height: 42px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: calc(100% - 54px);
  position: relative;
}

.pf-title {
  font-size: var(--mini-font);
  color: var(--main-normal);
  user-select: none;
  display: inline-block;
  width: fit-content;
  max-width: 100%;
  text-overflow: ellipsis;
}

.pf-bd {
  font-size: var(--mini-font);
  color: var(--main-note);
  user-select: none;
}

@media(hover: hover) {
  .pf-info:hover {
    .pf-title {
      text-decoration: underline;
    }
  }
}


</style>