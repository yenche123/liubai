<script setup lang="ts">
import PageDefault from "~/pages/shared/page-default/page-default.vue";
import { useI18n } from "vue-i18n";
import { useConnectWeChat } from "./tools/useConnectWeChat"

const { t } = useI18n()
const { 
  cwcData,
  onWechatRemindChanged,
  onTapAddWeChat,
  onTapFollowOnWeChat,
} = useConnectWeChat()

</script>
<template>

  <PageDefault title-key="connect.wechat">


    <PlaceholderView
      :p-state="cwcData.pageState"
    ></PlaceholderView>


    <div class="cw-container" v-if="cwcData.pageState < 0">

      <div class="cw-bar">
        <div class="liu-no-user-select cwb-title">
          <span>{{ t('connect.wechat_remind') }}</span>
        </div>


        <div class="liu-no-user-select cwb-footer" 
          v-if="cwcData.wx_gzh_openid && cwcData.wx_gzh_subscribed"
        >
          <liu-switch 
            :checked="cwcData.wx_gzh_toggle"
            @change="onWechatRemindChanged($event.checked)"
          ></liu-switch>
        </div>

        <div class="liu-no-user-select cwb-footer" v-else>

          <custom-btn size="mini" @click="onTapFollowOnWeChat">

            <div class="cwbf-arrow">
              <svg-icon name="logos-wechat-half-fill" 
                class="cwbf-arrow-icon"
                color="var(--on-primary)"
              ></svg-icon>
            </div>

            <span v-if="cwcData.fr === 'wx_gzh'">{{ t('connect.bind') }}</span>
            <span v-else>{{ t('connect.follow') }}</span>
          </custom-btn>
          
        </div>

      </div>

      <div class="cw-desc">
        <span class="liu-selection">{{ t('connect.wechat_remind_desc') }}</span>
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
  padding: 32px 32px 40px 36px;
  box-shadow: var(--card-shadow-2);
  transition: .15s;
}

.cw-bar {
  width: 100%;
  display: flex;
  align-items: center;
  position: relative;
  padding-block-end: 16px;
}

.cwb-title {
  flex: 3;
  font-size: var(--title-font);
  color: var(--main-normal);
  font-weight: 700;
}

.cwb-footer {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.cwbf-arrow {
  padding-inline-end: 8px;
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

/** if container query is not supported yet */
@media screen and (max-width: 480px) {
  .cw-container {
    padding: 24px 24px 32px 28px;
  }
}

@container liu-mc-container (max-width: 480px) {
  .cw-container {
    padding: 24px 24px 32px 28px;
  }
}




</style>