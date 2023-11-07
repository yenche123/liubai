<script setup lang="ts">
import { useI18n } from "vue-i18n"
import type { LpaEmit, LpaProps } from "./tools/types"
import LiuAvatar from '~/components/common/liu-avatar/liu-avatar.vue';
import { useLpAccounts } from "./tools/useLpAccounts"

const props = defineProps<LpaProps>()
const emit = defineEmits<LpaEmit>()
const { t } = useI18n()

const {
  lpaData,
  onTapItem,
  onTapConfirm,
} = useLpAccounts(props, emit)

</script>
<template>

  <div class="lp-view">


    <div class="lpa-title">
      <span>{{ t('login.choosing_account') }}</span>
    </div>

    <div class="lpa-box">

      <template v-for="(item, index) in accounts" :key="item._id">
        <div class="lpa-item" @click.stop="onTapItem(index)">
          <LiuAvatar
            :member-show="item"
            class="lpa-avatar"
          ></LiuAvatar>
          <div class="lpa-name">
            <span v-if="item.name">{{ item.name }}</span>
            <span v-else>{{ t('common.unknown') }}</span>
          </div>
          <div class="lpa-footer">
            <LiuCheckbox 
              :checked="index === lpaData.selectedIndex" 
              :size="20"
              :circleSize="10.6"
            ></LiuCheckbox>
          </div>
        </div>
      </template>
      
    </div>

    <!-- 确定按钮 -->
    <CustomBtn
      :disabled="lpaData.selectedIndex < 0"
      class="lp-btn"
      @click="onTapConfirm"
    >
      <span>{{ t('common.confirm') }}</span>
    </CustomBtn>

  </div>

</template>
<style scoped lang="scss">

.lp-view {
  width: 100%;
  min-height: 350px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.lpa-title {
  text-align: center;
  width: 100%;
  max-width: 450px;
  margin-block-end: 48px;
  font-size: var(--title-font);
  color: var(--main-normal);
  font-weight: 700;

  span::selection {
    background-color: var(--select-bg);
  }
}

.lpa-box {
  width: 100%;
  max-width: 450px;
  border-radius: 8px;
  padding: 20px 10px;
  background-color: var(--card-bg);
  box-shadow: var(--card-shadow);
  position: relative;
  box-sizing: border-box;
  margin-block-end: 48px;
}

.lpa-item {
  width: 100%;
  display: flex;
  position: relative;
  box-sizing: border-box;
  padding: 10px 10px;
  border-radius: 16px;
  margin-block-end: 5px;
  cursor: pointer;
  transition: 90ms;
}

.lpa-avatar {
  width: 38px;
  height: 38px;
  margin-inline-end: 16px;
  flex: none;
}

.lpa-name {
  width: calc(100% - 90px);
  font-size: var(--btn-font);
  color: var(--main-normal);
  line-height: 1.5;
  padding-block-start: 5px;
  user-select: none;
}

.lpa-footer {
  height: 38px;
  padding-inline-start: 5px;
  flex: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.lp-btn {
  width: 100%;
  max-width: 450px;
}

@media(hover: hover) {

  .lpa-item:hover {
    background-color: var(--card-hover);
  }

}


</style>