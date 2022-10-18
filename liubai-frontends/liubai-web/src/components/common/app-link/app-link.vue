<script lang="ts">
import { RouterLink } from 'vue-router'
import { useAppLink } from "./tools/useAppLink";

export default {
  name: "AppLink",
  inheritAttrs: false,

  props: {
    //@ts-ignore
    ...RouterLink.props,
    inactiveClass: String,
  },

  setup(props: any, context: any) {
    const {
      isExternalLink,
      href,
      isActive,
      isExactActive,
      onTapLink,
    } = useAppLink(props)

    return { isExternalLink, href, isActive, isExactActive, onTapLink }
  }
}

</script>

<template>
  <a v-if="isExternalLink" v-bind="$attrs" :href="to" target="_blank">
    <slot />
  </a>
  <router-link
    v-else
    v-bind="$props"
    custom
    :to="to"
  >
    <a
      v-bind="$attrs"
      :href="href"
      @click="onTapLink"
      :class="isActive ? activeClass : inactiveClass"
    >
      <slot />
    </a>
  </router-link>
</template>