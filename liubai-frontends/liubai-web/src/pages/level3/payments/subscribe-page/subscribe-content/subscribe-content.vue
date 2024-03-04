<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useSubscribeContent } from "./tools/useSubscribeContent"
import { toRef } from "vue";

const { scData } = useSubscribeContent()
const pi = toRef(scData, "subPlanInfo")

const { t } = useI18n()

</script>
<template>

  <PlaceholderView
    :p-state="scData.state"
  ></PlaceholderView>

  <div class="liu-mc-container">
    <div class="liu-tc-virtual"></div>
    <div class="liu-mc-box" v-if="pi">

      <!-- 方案标题 -->
      <div class="sc-title">
        <span>{{ pi.title }}</span>
      </div>

      <div class="sc-box">

        <!-- 徽章 或 终身会员 -->
        <div class="sc-badge">
          <span v-if="scData.isLifelong">{{ t('payment.lifetime') }}</span>
          <span v-else>{{ pi.badge }}</span>
        </div>

        <!-- 什么时候过期 或 什么时候续费 -->
        <div class="scb-footer" v-if="!scData.isLifelong && scData.expireStr">
          <span v-if="scData.autoRecharge">{{ t('payment.recharge_date', { date: scData.expireStr }) }}</span>
          <span v-else>{{ t('payment.expire_date', { date: scData.expireStr }) }}</span>
        </div>
      </div>

      <!-- 方案内文 -->
      
      
    </div>



  </div>



</template>
<style scoped lang="scss">




</style>