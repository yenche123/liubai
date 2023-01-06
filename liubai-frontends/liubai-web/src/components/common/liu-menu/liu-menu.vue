
<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import type { PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import type { MenuItem } from "./tools/types"
// 【待完善项】因为是 Menu 选单，应该可以用 Keyboard 的上下键来选择

type MenuPlacement = "bottom" | "bottom-start" | "bottom-end" 
  | "auto" | "top" | "top-start" | "top-end"

export default defineComponent({
  props: {
    menu: {
      type: Array as PropType<MenuItem[]>,
      default: [],
    },
    minWidthStr: {
      type: String,
    },
    placement: {
      type: String as PropType<MenuPlacement>,
      default: "bottom",
    },
    allowMask: {
      type: Boolean,
      default: true
    },
    maskZIndex: {
      type: String,
      default: "2000"
    },
  },
  emits: {
    tapitem: (item: MenuItem, index: number) => true,
    menushow: () => true,
    menuhide: () => true
  },
  setup(props, { emit }) {
    const showMask = ref(false)
    const hasIcon = computed(() => props.menu.some(v => !!v.iconName))
    const defaultColor = "var(--main-normal)"
    const { t } = useI18n()

    const onTapBox = (e: Event) => {
      e.stopPropagation()
      e.preventDefault()
    }

    const onTapItem = (item: MenuItem, index: number, hide: () => void) => {
      emit("tapitem", item, index)
      hide()
    }

    const onMenuShow = (e: any) => {
      console.log("menu show.............")
      emit("menushow")
      if(props.allowMask) showMask.value = true
    }

    const onMenuHide = () => {
      console.log("menu hide.............")
      emit("menuhide")
      if(props.allowMask) showMask.value = false
    }

    return {
      showMask,
      t,
      hasIcon,
      defaultColor,
      onTapBox,
      onTapItem,
      onMenuShow,
      onMenuHide,
    }
  },
})

</script>
<template>

  <div v-if="allowMask && showMask" class="lm-mask" />

  <VDropdown 
    :hideTriggers="['click']"
    :placement="placement"
    theme="liu-menu"
    @show="onMenuShow"
    @hide="onMenuHide"
  >

    <template #default>
      <div @click="onTapBox">
        <slot></slot>
      </div>
    </template>
    
    <template #popper="{ hide }">
      <div class="menu-container"
        :style="{ 'min-width': minWidthStr ? minWidthStr : undefined }"
      >

        <template v-for="(item, index) in menu" :key="item.text_key">
        
          <div class="menu-item"
            @click="onTapItem(item, index, hide)"
          >
          
            <div v-if="hasIcon" class="mi-icon-box">
              <SvgIcon v-if="item.iconName" :name="item.iconName"
                class="mi-icon"
                :color="item.color ? item.color : defaultColor"
              ></SvgIcon>
            </div>
  
            <div class="mi-title"
              :style="{ 'color': item.color ? item.color : defaultColor }"
            >
              <span>{{ t(item.text_key) }}</span>
            </div>

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
    }

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