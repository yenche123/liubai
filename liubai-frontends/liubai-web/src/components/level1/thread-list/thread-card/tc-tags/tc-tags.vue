<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';
import type { TagShow } from "../../../../../types/types-content"
import { RouterLink } from 'vue-router'
import { useWorkspaceStore } from '../../../../../hooks/stores/useWorkspaceStore';
import { storeToRefs } from 'pinia';
import { useRouteAndLiuRouter } from '../../../../../routes/liu-router';

export default defineComponent({
  components: {
    RouterLink
  },
  props: {
    tagShows: {
      type: Array as PropType<TagShow[]>,
      default: []
    },
  },
  setup(props, { emit }) {
    const { router } = useRouteAndLiuRouter()
    
    const wStore = useWorkspaceStore()
    const { workspace } = storeToRefs(wStore)
    const toPath = computed(() => {
      const w = workspace.value
      if(w === "ME") return `/tag/`
      return `/w/${w}/tag/`
    })

    const onTapTag = (e: MouseEvent, href: string) => {
      e.preventDefault()
      router.push(href)
    }

    return {
      toPath,
      onTapTag,
    }
  },
})

</script>
<template>

  <div class="ce-tags">

    <template v-for="(item, index) in tagShows" :key="item.tagId">
      <RouterLink
        :to="toPath + item.tagId"
        custom
      >
        <a
          :href="toPath + item.tagId"
          @click="onTapTag($event, toPath + item.tagId)"
        >
          <div class="ce-tag-item">
            <span v-if="item.emoji" class="ce-tag-emoji">{{ item.emoji }} </span>
            <span>{{ item.text }}</span>
          </div>
        </a>
      
      </RouterLink>

    </template>

  </div>

</template>
<style scoped lang="scss">

.ce-tags {
  display: flex;
  flex-wrap: wrap;
  width: 100%;


  .ce-tag-item {
    padding: 6px 12px 6px 12px;
    font-size: var(--btn-font);
    color: var(--liu-quote);
    background-color: var(--tag-bg);
    border-radius: 10px;
    margin-inline-end: 10px;
    margin-block-start: 10px;
    user-select: none;
    display: flex;
    align-items: center;
    white-space: pre-wrap;
    cursor: pointer;
    
    .ce-tag-emoji {
      margin-inline-end: 6px;
    }


  }


}

</style>