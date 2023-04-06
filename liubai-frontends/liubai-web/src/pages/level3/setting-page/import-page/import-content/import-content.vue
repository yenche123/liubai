<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useImportContent } from "./tools/useImportContent";
import liuUtil from "~/utils/liu-util";

const { t } = useI18n()

const iconColor = "var(--main-normal)"
const { 
  oursFileEl,
  onOursFileChange 
} = useImportContent()
const { APP_NAME } = liuUtil.getEnv()

</script>
<template>

  <div class="liu-mc-container">
    <div class="liu-mc-box">

      <div class="sc-box">

        <!-- 从专有格式导入 -->
        <div class="liu-hover sc-bar">
          <div class="scb-hd">
            <span>{{ t('import.t1', { appName: APP_NAME }) }}</span>
          </div>
          <div class="scb-footer">
            <div class="scb-footer-icon">
              <svg-icon class="scbf-back"
                name="arrow-right2"
                :color="iconColor"
              ></svg-icon>
            </div>
          </div>

          <input ref="oursFileEl" 
            type="file" 
            class="sc-file-input" 
            @change="onOursFileChange"
            accept="application/zip"
          />
        </div>

      </div>


    </div>
  </div>

</template>
<style scoped lang="scss">

.sc-box {
  background-color: var(--card-bg);
  border-radius: 24px;
  position: relative;
  padding: 16px 10px 10px 10px;
  width: 100%;
  box-sizing: border-box;
  box-shadow: var(--card-shadow-2);
  margin-block-end: 32px;
}

.sc-bar {
  width: 100%;
  border-radius: 8px;
  position: relative;
  display: flex;
  box-sizing: border-box;
  margin-block-end: 6px;
  overflow: hidden;
  padding: 10px 10px;
  user-select: none;
}

.sc-bar::before {
  border-radius: 8px;
}

.sc-file-input {
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.scb-hd {
  flex: 1;
  font-size: var(--desc-font);
  color: var(--main-normal);
  font-weight: 700;
}

.scb-main {
  flex: 1;
}

.scbm-hd {
  margin-block-end: 2px;
}

.scbm-bd {
  font-size: var(--mini-font);
  color: var(--main-note);
}

.scb-footer {
  flex: 0 0 40px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.scb-footer-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.scbf-back {
  width: 18px;
  height: 18px;
  transition: .3s;
}


</style>