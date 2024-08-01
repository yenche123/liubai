<script setup lang="ts">
import type { ConnectItemProps } from "./tools/types";
import AppLink from '~/components/common/app-link/app-link.vue';
import { useI18n } from "vue-i18n";

defineProps<ConnectItemProps>()

const { t } = useI18n()

</script>
<template>

  <div class="ci-container">

    <AppLink :to="prefix + 'connect/' + connectorId">

      <div class="ci-box">

        <!-- icon -->
        <div class="ci-icon"></div>
        
        <!-- info -->
        <div class="ci-info">
          <div class="ci-title">
            <span>{{ t(titleKey) }}</span>
          </div>

          <div class="ci-desc">
            <span>{{ t(descKey) }}</span>
          </div>

        </div>

      </div>
  
    </AppLink>

  </div>

</template>
<style scoped lang="scss">

.ci-container {
  position: relative;
  width: 100%;
  margin-block-end: 12px;
}

.ci-box {
  position: relative;
  width: 100%;
  display: flex;
  align-items: flex-start;
  background-color: var(--card-bg);
  border-radius: 16px;
  padding: 32px 32px 32px 48px;
  box-sizing: border-box;
  box-shadow: var(--card-shadow-2);
  transition: .15s;
  cursor: pointer;
}

.ci-icon {
  width: 48px;
  height: 48px;
  background-image: v-bind("'url(' + iconUrl + ')'");
  background-size: contain;
  margin-inline-end: 24px;
  flex: none;
}

.ci-info {
  flex: 1;
  position: relative;
}

.ci-title {
  font-weight: 700;
  font-size: var(--title-font);
  color: var(--main-text);
  margin-block-end: 4px;
  letter-spacing: 1px;
}

.ci-desc {
  font-size: var(--btn-font);
  color: var(--main-normal);
}


@media(hover: hover) {
  .ci-box:hover {
    box-shadow: var(--card-shadow2-hover);
  }
}


@container liu-mc-container (max-width: 480px) {

  .ci-box {
    padding: 24px 24px 24px 32px;
  }

  .ci-icon {
    width: 40px;
    height: 40px;
    margin-inline-end: 20px;
  }

  .ci-title {
    font-size: var(--desc-font);
    margin-block-end: 0px;
  }

  .ci-desc {
    font-size: var(--mini-font);
  }

}


</style>