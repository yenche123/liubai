<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { useAgreePage } from "./tools/useAgreePage";
import { computed } from 'vue';

const { apData } = useAgreePage()
const { t } = useI18n()

const eventKey = computed(() => {
  const cT = apData.contentType
  if(cT === "todo") return "thread_related.todo"
  if(cT === "calendar") return "thread_related.agenda"
  return "thread_related.note"
})

</script>
<template>
  <div class="liu-simple-page">

    <div class="liu-mc-container">

      <PlaceholderView :p-state="apData.pageState"></PlaceholderView>

      <div v-show="apData.pageState < 0" 
        class="liu-no-user-select liu-mc-box"
      >

        <div class="ap-icon-box">
          <svg-icon name="emojis-ok_hand_color_default" 
            class="ap-icon"
            :cover-fill-stroke="false"
          ></svg-icon>
        </div>

        <div class="ap-title">
          <span>{{ t('thread_related.captured_that', { event: t(eventKey) }) }}</span>
        </div>

        <div class="ap-btn-container">

          <!-- OK -->
          <custom-btn class="ap-btn ap-ok-btn">
            <span>{{ t('common.ok') }}</span>
          </custom-btn>

          <!-- check it out -->
          <custom-btn type="pure" class="ap-btn">
            <span>{{ t('common.check_it_out') }}</span>
          </custom-btn>

        </div>

      </div>

    </div>

    

  </div>
</template>
<style scoped lang="scss">

.liu-mc-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  height: 100dvh;
}

.ap-icon-box {
  width: 100px;
  height: 100px;
  position: relative;
  margin-block-end: min(10%, 50px);

  .ap-icon {
    width: 100%;
    height: 100%;
  }
}

.ap-title {
  width: 100%;
  text-align: center;
  font-size: var(--head-font);
  color: var(--main-normal);
  font-weight: 700;
  margin-block-end: min(10%, 50px);
}

.ap-btn-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  position: absolute;
  bottom: 40px;
  left: 0;
  right: 0;
}

.ap-ok-btn {
  margin-block-end: 10px;
}

/** for wide screen */
@media screen and (min-width: 590px) {

  .ap-icon-box {
    margin-block-end: min(20%, 100px);
  }

  .ap-title {
    font-size: var(--big-word-style);
  }

  .ap-btn-container {
    position: relative;
    flex-direction: row-reverse;
    justify-content: space-around;
    bottom: 0;
  }

  .ap-btn {
    width: 40%;
    max-width: 300px;
  }

  .ap-ok-btn {
    margin-block-end: 0;
  }
}




</style>
