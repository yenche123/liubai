<script lang="ts" setup>
import LiuAvatar from '~/components/common/liu-avatar/liu-avatar.vue';
import { useMineContent } from "./tools/useMineContent"
import { useI18n } from 'vue-i18n';

const {
  myProfile,
  isPremium,
} = useMineContent()

const { t } = useI18n()

</script>
<template>

  <!-- me -->
  <div class="mc-me">

    <!-- avatar -->
    <LiuAvatar v-if="myProfile" :member-show="myProfile"
      class="mc-me-avatar"
    ></LiuAvatar>

    <!-- name -->
    <div v-if="myProfile?.name" class="mc-me-name">
      <span>{{ myProfile.name }}</span>
    </div>

    <!-- premium -->
    <div class="mc-me-premium-box" v-if="isPremium">
      <LiuTooltip
        placement="bottom-start"
        :distance="4"
        :aria-label="t('premium.badge_tip')"
      >
        <div class="liu-no-user-select mc-me-premium">
          <span>🥂</span>
          <span class="mc-premium-text">Premium</span>
        </div>
      </LiuTooltip>
    </div>

  </div>

  <!-- favorite + tags + kanban -->
  <div class="mc-box">

  </div>

  <!-- connections + settings + trash -->
  <div class="mc-box">
    
  </div>
  

</template>
<style scoped lang="scss">



</style>