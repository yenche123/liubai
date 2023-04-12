<script setup lang="ts">
import { PropType, computed, ref } from 'vue';
import type { ImportedAtom2 } from "../tools/types"
import { useI18n } from 'vue-i18n';
import TcCovers from "~/components/level1/thread-list/thread-card/tc-covers/tc-covers.vue";

const { t } = useI18n()

const props = defineProps({
  list: {
    type: Array as PropType<ImportedAtom2[]>,
    required: true,
  }
})

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
  <div v-if="showMore" class="ir-mask" @click.stop="onTapShowMore">
    <span>{{ t('common.checkMore') }}</span>
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
  transition: border-radius .3s;
  margin-bottom: 6px;
  box-sizing: border-box;
  padding: 16px;
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
  font-weight: 700;
  letter-spacing: 2px;
  width: 100%;
  height: 100px;
  margin-top: -75px;
  color: var(--main-normal);
  background: var(--mask-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: var(--btn-font);
  position: relative;
  cursor: pointer;
  transition: .15s;
}

@media(hover: hover) {
  .ir-mask:hover {
    font-size: var(--desc-font);
  }

}



</style>