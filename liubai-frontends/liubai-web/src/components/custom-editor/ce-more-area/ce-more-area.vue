<script lang="ts">
import { computed, defineComponent, inject } from 'vue';
import type { Ref } from "vue";
import { useI18n } from 'vue-i18n';
import { mvKey } from "../../../utils/provide-keys"
import LiuMenu from "../../common/liu-menu/liu-menu.vue"
import type { LiuRemindMe } from "../../../types/types-atom";
import { useMoreArea } from "./tools/useMoreArea";
import { receiveCmaProps } from "./tools/receiveCmaProps"
import { cmaProps } from "./tools/types-cma"

export default defineComponent({
  components: {
    LiuMenu,
  },
  props: cmaProps,
  emits: {
    whenchange: (val: Date | null) => true,
    remindmechange: (val: LiuRemindMe | null) => true,
    titlechange: (val: string) => true,
    synccloudchange: (val: boolean) => true,
    filechange: (val: File[] | null) => true,
  },
  setup(props, { emit }){
    const critialPoint = 600
    const mvRef = inject(mvKey) as Ref<number>
    const containerMaxHeightPx = computed(() => {
      if(mvRef.value < critialPoint) return 400
      return 200
    })
    const { t } = useI18n()
    const default_color = "var(--other-btn-text)"
    const moreArea = useMoreArea(emit)
    receiveCmaProps(props, moreArea.data)
    
    return {
      critialPoint,
      mvRef,
      containerMaxHeightPx,
      t,
      default_color,
      ...moreArea
    }
  },
})

</script>
<template>
  <div class="ma-container"
    :class="{ 'ma-container_expand': show }"
  >

    <div style="width: 100%; height: 10px"></div>

    <div class="ma-grid"
      :class="{ 'ma-grid-one-column': mvRef < critialPoint }"
    >
      <!-- 什么时候 -->
      <div class="liu-hover ma-item" @click="onTapWhen">
        <div class="mai-icon">
          <svg-icon name="when" class="mai-svgicon" :color="default_color"></svg-icon>
        </div>
        <div class="mai-title">
          <span v-if="data.whenStr">{{ data.whenStr }}</span>
          <span v-else>{{ t("editor.when") }}</span>
        </div>
        <div v-if="data.whenStr" class="liu-hover mai-footer" @click="onTapClearWhen">
          <svg-icon name="close" class="maif-clear" :color="default_color"></svg-icon>
        </div>
        <div v-else class="mai-footer">
          <svg-icon name="arrow-right2" class="maif-icon" :color="default_color"></svg-icon>
        </div>
      </div>

      <!-- 提醒我 -->
      <LiuMenu :menu="remindMenu"
        @tapitem="onTapRemindItem"
      >

        <div class="liu-hover ma-item">
          <div class="mai-icon">
            <svg-icon name="notification" class="mai-svgicon" :color="default_color"></svg-icon>
          </div>
          <div class="mai-title">
            <span v-if="data.remindMeStr">{{ data.remindMeStr }}</span>
            <span v-else>{{ t("editor.remind") }}</span>
          </div>
          <div v-if="data.remindMeStr" class="liu-hover mai-footer" @click="onTapClearRemind">
            <svg-icon name="close" class="maif-clear" :color="default_color"></svg-icon>
          </div>
          <div v-else class="mai-footer">
            <svg-icon name="arrow-right2" class="maif-icon" :color="default_color"></svg-icon>
          </div>
        </div>

      </LiuMenu>
      
      <!-- 加标题 -->
      <div class="liu-hover ma-item" @click="onTapAddTitle">
        <div class="mai-icon">
          <svg-icon name="title" class="mai-svgicon" :color="default_color"></svg-icon>
        </div>
        <div class="mai-title">
          <span v-if="data.title">{{ data.title }}</span>
          <span v-else>{{ t("editor.add_title") }}</span>
        </div>
        <div v-if="data.title" class="liu-hover mai-footer" @click="onTapClearTitle">
          <svg-icon name="close" class="maif-clear" :color="default_color"></svg-icon>
        </div>
        <div v-else class="mai-footer">
          <svg-icon name="arrow-right2" class="maif-icon" :color="default_color"></svg-icon>
        </div>
      </div>

      <!-- 加位置 -->
      <div class="liu-hover ma-item">
        <div class="mai-icon">
          <svg-icon name="location" class="mai-svgicon" :color="default_color"></svg-icon>
        </div>
        <div class="mai-title">
          <span>{{ t("editor.add_site") }}</span>
        </div>
        <div class="mai-footer">
          <svg-icon name="arrow-right2" class="maif-icon" :color="default_color"></svg-icon>
        </div>
      </div>

      <!-- 加附件 -->
      <div class="liu-hover ma-item">

        <input ref="selectFileEl" 
          type="file" 
          class="mai-input" 
          @change="onFileChange"
        />

        <div class="mai-icon">
          <svg-icon name="attachment" class="mai-svgicon" :color="default_color"></svg-icon>
        </div>
        <div class="mai-title">
          <span v-if="data.fileShow?.name">{{ data.fileShow.name }}</span>
          <span v-else>{{ t("editor.add_file") }}</span>
        </div>
        <div v-if="data.fileShow?.name" class="liu-hover mai-footer" @click="onTapClearAttachment">
          <svg-icon name="close" class="maif-clear" :color="default_color"></svg-icon>
        </div>
        <div v-else class="mai-footer">
          <svg-icon name="arrow-right2" class="maif-icon" :color="default_color"></svg-icon>
        </div>
        
      </div>

      <!-- 同步到云端 -->
      <div class="liu-hover ma-item" @click="onTapSyncToCloud">
        <div class="mai-icon">
          <svg-icon name="cloud" class="mai-svgicon" :color="default_color"></svg-icon>
        </div>
        <div class="mai-title">
          <span>{{ t("editor.sync_cloud") }}</span>
        </div>
        <div class="mai-switch-footer">
          <liu-switch :checked="data.syncCloud"
            @change="onSyncCloudChange"
            :disabled="data.scDisabled"
          ></liu-switch>
        </div>
      </div>


    </div>

  </div>

</template>
<style scoped lang="scss">

.ma-container {
  position: relative;
  width: 100%;
  overflow: hidden;
  transition: .3s;
  max-height: 0;
  opacity: 0;
}

.ma-container_expand {
  max-height: v-bind("containerMaxHeightPx + 'px'");
  opacity: 1;
}

/** 默认使用 两列布局 */
.ma-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 5px;    /** <grid-row-gap> <grid-column-gap> */
}

.ma-grid-one-column {
  grid-template-columns: 1fr;
  gap: 4px;
}

.ma-item {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  min-height: 48px;

  .mai-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-inline-end: 8px;

    .mai-svgicon {
      width: 24px;
      height: 24px;
    }
  }

  .mai-title {
    flex: 1;
    font-size: var(--btn-font);
    font-weight: 400;
    color: var(--other-btn-text);
    user-select: none;
    display: inline-block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .mai-footer {
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    margin-inline-end: 4px;

    .maif-icon {
      width: 16px;
      height: 16px;
    }

    .maif-clear {
      width: 20px;
      height: 20px;
    }
  }

  .mai-input {
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    position: absolute;
    opacity: 0;
    cursor: pointer;
  }

  .mai-switch-footer {
    margin-inline-start: 4px;
    margin-inline-end: 4px;
  }

}


</style>