<script lang="ts">
import { computed } from "vue";
import { RouterLink, useLink } from 'vue-router'

export default {
  name: "AppLink",
  inheritAttrs: false,

  props: {
    //@ts-ignore
    ...RouterLink.props,
    inactiveClass: String,
  },

  setup(props: any, context: any) {
    const { navigate, href, route, isActive, isExactActive } = useLink(props)
    const isExternalLink  = computed(() => {
      const t = props.to
      if(typeof t !== "string") return false
      if(t.startsWith("http")) return true
      return false
    })

    const onTapLink = (e: MouseEvent) => {
      // console.log("被点击了............")
      // console.log(e)
      // console.log(" ")
      // e.preventDefault()
      navigate(e)
    }

    return { isExternalLink, href, isActive, onTapLink }
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