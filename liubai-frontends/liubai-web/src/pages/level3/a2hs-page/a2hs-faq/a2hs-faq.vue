<script setup lang="ts">
import { inject, ref } from "vue";
import { useI18n } from "vue-i18n"
import { showA2hsFaqKey } from "~/utils/provide-keys";

const { t } = useI18n()
const inApp = inject(showA2hsFaqKey)

</script>
<template>

  <div class="liu-no-user-select a2hs-faq">
    <span>🪧 {{ t('common.faq') }}</span>
  </div>
  <div class="a2hs-faq-title">
    <span v-if="inApp" class="liu-selection">{{ t('a2hs.add_twice_title') }}</span>
    <span v-else class="liu-selection">{{ t('a2hs.why_recommand') }}</span>
  </div>
  <div class="a2hs-faq-desc">
    <span class="liu-selection">{{ t('a2hs.add_twice_desc_1') }}</span>
    <a :href="t('a2hs.apple_link')"
      target="_blank" class="liu-selection"
    >{{ t('a2hs.apple_policy') }}</a>

    <span v-if="inApp" class="liu-selection">{{ t('a2hs.add_twice_desc_2') }}</span>
    <span v-else>{{ t('a2hs.recommand_desc') }}</span>
  
  </div>

</template>
<style lang="scss" scoped>

.a2hs-faq {
  padding-block-start: 50px;
  padding-block-end: 10px;
  font-size: var(--desc-font);
  color: var(--main-text);
  font-weight: 700;
}

.a2hs-faq-title {
  font-size: var(--desc-font);
  color: var(--main-normal);
  font-weight: 700;
  margin-block-end: 5px;
}

.a2hs-faq-desc {
  font-size: var(--btn-font);
  color: var(--main-normal);
  display: inline;
  line-height: 1.5;
}



</style>