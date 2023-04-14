<script setup lang="ts">
import { computed, ref, inject } from 'vue';
import type { Ref, PropType } from "vue";
import type { ImportedAtom2 } from "../tools/types"
import { useI18n } from 'vue-i18n';
import TcCovers from "~/components/level1/thread-list/thread-card/tc-covers/tc-covers.vue";
import { mainViewWidthKey } from "~/utils/provide-keys";

const { t } = useI18n()

const props = defineProps({
  list: {
    type: Array as PropType<ImportedAtom2[]>,
    required: true,
  }
})

defineEmits<{
  (event: "tapclear", index: number): void
  (event: "tapconfirm"): void
  (event: "tapcancel"): void
}>()

const maxNum = ref(3)
const onTapShowMore = () => {
  let oldNum = maxNum.value
  maxNum.value = oldNum + 10
}

// 是否要显示 “查看更多”
const showMore = computed(() => {
  const len = props.list.length
  const m = maxNum.value
  if(len <= 3) return false
  if(m >= len) return false
  return true
})

const moreColor = `var(--main-normal)`
const iconColor = `var(--liu-quote)`

// 获取 main-view 的宽度
const mvWidth = inject(mainViewWidthKey) as Ref<number>
const smallView = computed(() => {
  const w = mvWidth.value
  return w < 450
})

</script>
<template>

  <div class="ir-first-bar">
    <div class="irf-title">
      <span>{{ t('import.parse_result') }}</span>
    </div>
  </div>

  <div class="ir-box">
    <template v-for="(item, index) in list" :key="item.id">
      <div v-if="index < maxNum" class="ir-item">

        <div class="iri-top">

          <!-- 状态: 新的动态、需要更新、没有变化 -->
          <div class="iri-status"
            :class="{ 
              'iri-status_new': item.status === 'new',
              'iri-status_update': item.status === 'update_required',
            }"
          >
            <span v-if="item.status === 'new'">{{ t('import.new_thread') }}</span>
            <span v-else-if="item.status === 'update_required'">{{ t('import.update_required') }}</span>
            <span v-else-if="item.status === 'no_change'">{{ t('import.no_change') }}</span>
          </div>

          <!-- 清除按钮 -->
          <div class="liu-hover iri-clear-btn" @click.stop="$emit('tapclear', index)">
            <svg-icon name="close" class="iricb-svg" :color="iconColor"></svg-icon>
          </div>

        </div>

        <div class="iri-title" v-if="item.threadShow.title">
          <span>{{ item.threadShow.title }}</span>
        </div>

        <div class="iri-text">
          <span v-if="item.threadShow.summary">{{ item.threadShow.summary }}</span>
          <span v-else>{{ t("thread_related.img_file") }}</span>
        </div>

        <!-- 图片 -->
        <TcCovers 
          :covers="item.threadShow.images"
          :img-layout="item.threadShow.imgLayout"
        ></TcCovers>

      </div>
    </template>

  </div>
  <div v-if="showMore" class="ir-mask">
    <div class="irm-inline" @click.stop="onTapShowMore">
      <span>{{ t('common.checkMore') }}</span>
      <div class="irm-icon-box">
        <svg-icon class="irm-icon" name="arrow-right2" :color="moreColor"></svg-icon>
      </div>
    </div>
  </div>

  <!-- 导入动态 & 底部操作按钮们 的留白空间 -->
  <div class="ir-virtual" />

  <div class="ir-btns">
    <CustomBtn size="common" type="transparent" @click="$emit('tapcancel')"
      class="ir-btn"
    >
      <span>{{ t('common.cancel') }}</span>
    </CustomBtn>

    <CustomBtn size="common" @click="$emit('tapconfirm')" 
      class="ir-btn"
    >
      <span>{{ t('setting.import') }}</span>
    </CustomBtn>
  </div>

</template>
<style scoped lang="scss">

.ir-first-bar {
  width: 100%;
  position: relative;
  margin-block-end: 8px;
  display: flex;
}

.irf-title {
  font-size: var(--title-font);
  font-weight: 700;
  color: var(--main-normal);
  margin-inline-start: 10px;
  user-select: none;
}

.ir-item {
  width: 100%;
  border-radius: 6px;
  position: relative;
  background-color: var(--card-bg);
  box-shadow: var(--card-shadow-2);
  margin-bottom: 6px;
  box-sizing: border-box;
  padding: 12px 16px 16px;
}

.iri-top {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-block-end: 4px;
}

.iri-status {
  padding: 4px 12px;
  border-radius: 2px;
  font-size: var(--mini-font);
  color: var(--liu-state-1);
  margin-inline-end: 6px;
  position: relative;
  overflow: hidden;
  user-select: none;

  &::before {
    background-color: var(--liu-state-1);
    opacity: .2;
    position: absolute;
    content: "";
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
}

.iri-status_new {
  color: var(--liu-state-2);

  &::before {
    background-color: var(--liu-state-2);
  }
}

.iri-status_update {
  color: var(--liu-state-10);

  &::before {
    background-color: var(--liu-state-10);
  }
}

.iri-clear-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.iricb-svg {
  width: 24px;
  height: 24px;
}

.iri-title {
  line-height: 2;
  font-size: var(--desc-font);
  font-weight: 700;
  color: var(--main-normal);
}

.iri-text {
  position: relative;
  width: 100%;
  font-size: var(--inline-code-font);
  line-height: 1.75;
  color: var(--main-code);
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}

.iri-title, .iri-text {
  span::selection {
    background-color: var(--select-bg);
  }
}

.ir-mask {
  width: 100%;
  height: 75px;
  margin-top: -50px;
  background: var(--mask-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.irm-inline {
  width: 50%;
  height: 50px;
  min-width: 200px;
  font-weight: 700;
  font-size: var(--btn-font);
  letter-spacing: 2px;
  color: v-bind("moreColor");
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  position: relative;
  cursor: pointer;
  transition: .15s;
}

@media(hover: hover) {
  .irm-inline:hover {
    transform: scale(1.15);
  }
}

.irm-icon-box {
  margin-inline-start: 6px;
  overflow: hidden;
  height: 16px;
  width: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--main-normal);

  .irm-icon {
    width: 12px;
    height: 12px;
    transform: rotate(90deg);
  }

}

.ir-virtual {
  width: 100%;
  height: v-bind("showMore ? '10px' : '30px'");
}

.ir-btns {
  padding: v-bind("smallView ? '0 0 50px' : '0 30px 50px 30px'");
  display: flex;
  justify-content: v-bind("smallView ? 'space-between' : 'space-evenly'");
  position: relative;
}

.ir-btn {
  min-width: v-bind("smallView ? '45%' : '160px'");
}

</style>