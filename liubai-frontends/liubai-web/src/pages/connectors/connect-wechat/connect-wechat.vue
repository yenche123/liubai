<script setup lang="ts">
import PageDefault from "~/pages/shared/page-default/page-default.vue";
import { useI18n } from "vue-i18n";
import { useConnectWeChat } from "./tools/useConnectWeChat"

const { t } = useI18n()
const { 
  cwcData,
  onWechatRemindChanged,
} = useConnectWeChat()

</script>
<template>

  <PageDefault title-key="connect.wechat">

    <div class="cw-container">

      <div class="cw-bar">
        <div class="liu-no-user-select cwb-title">
          <span>{{ t('connect.wechat_remind') }}</span>
        </div>


        <div class="liu-no-user-select cwb-footer" v-if="cwcData.ww_qynb_external_userid">
          <liu-switch 
            :checked="cwcData.wechatRemind"
            @change="onWechatRemindChanged($event.checked)"
          ></liu-switch>
        </div>

        <div class="liu-no-user-select cwb-footer cwb-footer_add" v-else>
          <span>{{ t('connect.add') }}</span>
          <div class="cwbf-arrow">
            <svg-icon name="arrow-right2" 
              class="cwbf-arrow-icon"
              color="var(--main-normal)"
            ></svg-icon>
          </div>
        </div>

      </div>

      <div class="cw-desc">
        <span>{{ t('connect.wechat_remind_desc') }}</span>
      </div>

    </div>

  </PageDefault>

</template>
<style scoped lang="scss">

.cw-container {
  position: relative;
  width: 100%;
  box-sizing: border-box;
  background-color: var(--card-bg);
  border-radius: 16px;
  padding: 32px 32px 32px 48px;
  box-shadow: var(--card-shadow-2);
  transition: .15s;
}

.cw-bar {
  width: 100%;
  display: flex;
  position: relative;
  padding-block-end: 4px;
}

.cwb-title {
  flex: 3;
  font-size: var(--desc-font);
  color: var(--main-normal);
  font-weight: 700;
}

.cwb-footer {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  font-size: var(--btn-font);
  color: var(--main-normal);
}

.cwb-footer_add {
  cursor: pointer;
}

.cwbf-arrow {
  padding-inline-start: 4px;
  width: 20px;
  height: 20px;
  position: relative;
}

.cwbf-arrow-icon {
  width: 100%;
  height: 100%;
}

.cw-desc {
  width: 100%;
  font-size: var(--btn-font);
  color: var(--main-code);
  line-height: 1.5;
}




</style>