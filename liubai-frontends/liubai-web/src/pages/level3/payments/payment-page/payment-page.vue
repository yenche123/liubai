<script setup lang="ts">
import ScrollView from "~/components/common/scroll-view/scroll-view.vue";
import PaymentContent from "./payment-content/payment-content.vue";
import { onActivated } from "vue";
import middleBridge from "~/utils/middle-bridge";

onActivated(() => {
  middleBridge.setAppTitle({ val_key: "payment.pay" })
})

</script>
<template>

  <div class="liu-simple-page">
    <scroll-view>
      <navi-virtual></navi-virtual>

      <div class="liu-mc-container">
        <div class="liu-tc-virtual"></div>
        <div class="liu-mc-box">
          <PaymentContent></PaymentContent>
        </div>
      </div>
      
    </scroll-view>
    <navi-bar></navi-bar>
  </div>

</template>
<style scoped lang="scss">

</style>