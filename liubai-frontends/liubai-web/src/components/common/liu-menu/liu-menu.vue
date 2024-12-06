<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { MenuItem } from "./tools/types"
import { useLiuMenu } from './tools/useLiuMenu'
import { liumenu_props } from "./tools/types"
import type { SimpleFunc } from "~/utils/basic/type-tool"
// 【待完善项】因为是 Menu 选单，应该可以用 Keyboard 的上下键来选择

const props = defineProps(liumenu_props)
const emit = defineEmits<{
  "tapitem": [item: MenuItem, index: number]
  "menushow": []
  "menuhide": []
}>()

const showMask = ref(false)
const hasIcon = computed(() => props.menu.some(v => !!v.iconName))
const defaultColor = "var(--main-normal)"
const { t } = useI18n()
const { 
  maskEl,
  connectMaskEl,
  disconnectMaskEl,
  onTouchEndMask,
} = useLiuMenu(props)

const onTapItem = (item: MenuItem, index: number, hide: SimpleFunc) => {
  if(props.hasCheckbox && item.disabled) {
    return
  } 
  emit("tapitem", item, index)
  if(props.autoHideAfterTappingItem) {
    hide()
  }
}

const onMenuShow = (e: any) => {
  emit("menushow")
  if(props.allowMask) showMask.value = true
  connectMaskEl()
}

const onMenuHide = () => {
  emit("menuhide")
  if(props.allowMask) showMask.value = false
  disconnectMaskEl()
}


</script>
<template>

  <Teleport v-if="allowMask && showMask" to="body">
    <div 
      ref="maskEl"
      class="lm-mask" 
      @click.stop.prevent="() => {}"
      @touchend.stop.prevent="onTouchEndMask"
    />
  </Teleport>

  <VDropdown 
    :showTriggers="showTriggers"
    :hideTriggers="hideTriggers"
    :placement="placement"
    :container="container"
    theme="liu-menu"
    @show="onMenuShow"
    @hide="onMenuHide"
  >

    <template #default>
      <div @click.stop.prevent="() => {}">
        <slot></slot>
      </div>
    </template>
    
    <template #popper="{ hide }">
      <div class="menu-container"
        :style="{ 'min-width': minWidthStr ? minWidthStr : undefined }"
      >

        <template v-for="(item, index) in menu" :key="item.text_key">
        
          <div class="menu-item"
            :class="{ 'menu-item_disabled': item.disabled }"
            @click="onTapItem(item, index, hide)"
          >
          
            <div v-if="hasIcon" class="mi-icon-box">
              <SvgIcon v-if="item.iconName" :name="item.iconName"
                class="mi-icon"
                :color="item.color ? item.color : defaultColor"
              ></SvgIcon>
            </div>
  
            <div class="mi-title"
              :class="{ 'mi-title_long': hasIcon || hasCheckbox }"
              :style="{ 'color': item.color ? item.color : defaultColor }"
            >
              <span>{{ t(item.text_key) }}</span>
            </div>

            <LiuCheckbox
              v-if="hasCheckbox"
              :checked="item.checked"
              :disabled="item.disabled"
              :size="20"
              :circleSize="10.6"
              checked-color="var(--cool-bg)"
            ></LiuCheckbox>

          </div>
        
        </template>

      </div>
    </template>

  </VDropdown>
</template>

<style lang="scss" scoped>

.lm-mask {
  position: fixed;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  top: 0;
  left: 0;
  z-index: v-bind("maskZIndex");
  cursor: auto;
}

</style>

<style lang="scss">

.menu-container {
  max-width: 90vw;
  display: flex;
  flex-direction: column;
  width: max-content;
  position: relative;
  padding: 8px 4px 4px;

  .menu-item {
    display: flex;
    flex: 1;
    padding: 4px 8px;
    margin-bottom: 4px;
    border: 0;
    border-radius: 4px;
    transition: .15s;
    position: relative;
    cursor: pointer;
    overflow: hidden;
    align-items: center;

    &::before {
      background-color: var(--primary-active);
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      content: "";
      transition: .15s;
      opacity: 0;
    }

    &:hover::before {
      opacity: .07;
    }

    &:active::before {
      opacity: .11;
    }

    .mi-icon-box {
      width: 28px;
      height: 28x;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 8px;

      .mi-icon {
        width: 20px;
        height: 20px;
      }
    }

    .mi-title {
      flex: 1;
      max-width: 300px;
      display: inline-block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: var(--mini-font);
      line-height: 28px;
      user-select: none;
      -webkit-user-select: none;
    }

    .mi-title_long {
      padding-inline-end: 8px;
    }

  }

  .menu-item_disabled {
    opacity: .6;
    cursor: not-allowed;
  }

}


/** 覆盖原 floating-vue 的 css */
.v-popper--theme-liu-menu {
  .v-popper__inner {
    border-radius: 8px;
    background: var(--card-bg);
    border: 1px solid var(--line-default);
    box-shadow: var(--floating-shadow);
  }

  .v-popper__arrow-outer {
    border-color: var(--line-default);
  }

  .v-popper__arrow-inner {
    border-color: var(--card-bg);
  }

}



</style>