<script setup lang="ts">
// 各模块的加载框
// 【待完善项】因为是 Menu 选单，应该可以用 Keyboard 的上下键来选择，待加上

import { computed } from 'vue'

export interface MenuItem {
  text: string
  iconName?: string
  color?: string
  borderBottom?: boolean
  children?: MenuItem[]
  [otherKey: string]: any
}

export interface Props {
  menu: MenuItem[]
}

const props = withDefaults(defineProps<Props>(), {
  menu: () => [],
})
const emits = defineEmits<{
  (event: "tapitem", item: MenuItem, index: number): void
  (event: "menushow"): void
  (event: "menuhide"): void
}>()

const hasIcon = computed(() => props.menu.some(v => !!v.iconName))
const defaultColor = "var(--main-normal)"

const onTapItem = (item: MenuItem, index: number) => {
  console.log("onTapItem.........")
  emits("tapitem", item, index)
}

const onMenuShow = () => {
  emits("menushow")
}

const onMenuHide = () => {
  emits("menuhide")
}


</script>
<template>
  <VDropdown :hideTriggers="['click']"
    @show="onMenuShow"
    @hide="onMenuHide"
  >

    <template #default>
      <slot></slot>
    </template>
    
    <template #popper>
      <div class="menu-container">

        <template v-for="(item, index) in menu" :key="item.text">
        
          <div class="menu-item"
            @click="onTapItem(item, index)"
            v-close-popper="item.children?.length ? false : true"
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
              <span>{{ item.text }}</span>
            </div>

          </div>
        
        </template>

        

        
      </div>
    </template>

  </VDropdown>
</template>
<style lang="scss">

.menu-container {
  min-width: 200px;
  max-width: 90vw;
  position: relative;
  padding: 8px 8px 4px;

  .menu-item {
    display: flex;
    flex: 1;
    padding: 4px;
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
      opacity: .14;
    }

    &:active::before {
      opacity: .17;
    }

    .mi-icon-box {
      width: 28px;
      height: 28x;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 4px;

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
.v-popper--theme-dropdown .v-popper__inner {
  border-radius: 8px;
  background: var(--card-bg);
  border: 1px solid var(--line-default);
  box-shadow: var(--floating-shadow);
}

.v-popper--theme-dropdown .v-popper__arrow-outer {
  border-color: var(--line-default);
}

.v-popper--theme-dropdown .v-popper__arrow-inner {
  border-color: var(--card-bg);
}


</style>