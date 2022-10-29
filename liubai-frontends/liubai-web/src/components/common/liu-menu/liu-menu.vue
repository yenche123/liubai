<script setup lang="ts">
// 各模块的加载框

import { computed } from 'vue'

export interface MenuItem {
  text: string
  iconName?: string
  color?: string
  borderBottom?: boolean
  children?: MenuItem[]
}

export interface Props {
  menu: MenuItem[]
}

const props = withDefaults(defineProps<Props>(), {
  menu: () => [],
})
const hasIcon = computed(() => props.menu.some(v => !!v.iconName))
const defaultColor = "var(--main-normal)"

const onTapItem = (item: MenuItem, index: number) => {
  console.log("onTapItem.........")
  console.log(index)
  console.log(item)
  console.log(" ")
}

</script>
<template>
  <VDropdown :hideTriggers="['click']">

    <template #default>
      <slot></slot>
    </template>
    
    <template #popper>
      <div class="menu-container">

        <div class="menu-item" v-for="(item, index) in menu" :key="item.text"
          @click="onTapItem(item, index)"
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
    }

  }

  .menu-item:hover {
    background-color: antiquewhite;
  }


}



</style>