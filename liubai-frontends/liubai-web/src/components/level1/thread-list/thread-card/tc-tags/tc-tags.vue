<script setup lang="ts">
import { computed } from 'vue';
import type { PropType } from 'vue';
import type { TagShow } from "~/types/types-content"
import { RouterLink } from 'vue-router'
import { useWorkspaceStore } from '~/hooks/stores/useWorkspaceStore';
import { storeToRefs } from 'pinia';
import { useRouteAndLiuRouter } from '~/routes/liu-router';

defineProps({
  tagShows: {
    type: Array as PropType<TagShow[]>,
    default: []
  },
})

const { router, route } = useRouteAndLiuRouter()
    
const wStore = useWorkspaceStore()
const { spaceType } = storeToRefs(wStore)
const toPath = computed(() => {
  const w = spaceType.value
  if(w === "TEAM") return `/w/${w}/tag/`
  return `/tag/`
})

const onTapTag = (e: MouseEvent, href: string) => {
  router.pushNewPageWithOldQuery(route, { path: href }, true)
}

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
          @click.stop.prevent="onTapTag($event, toPath + item.tagId)"
        >
          <div class="ce-tag-item">
            <span v-if="item.emoji" class="ce-tag-emoji">{{ item.emoji }} </span>
            <span v-else-if="item.parentEmoji" class="ce-tag-emoji">{{ item.parentEmoji }}</span>
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
  margin-inline-start: -6px;

  .ce-tag-item {
    padding: 6px 14px 6px 14px;
    font-size: var(--mini-font);
    color: var(--liu-quote);
    background: var(--tag-bg);
    border-radius: 6px;
    margin-inline-end: 10px;
    margin-block-start: 10px;
    user-select: none;
    display: flex;
    align-items: center;
    white-space: pre-wrap;
    cursor: pointer;
    position: relative;
    overflow: hidden;

    &::before {
      background: var(--tag-hover);
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      position: absolute;
      content: "";
      opacity: 0;
      transition: .15s;
    }

    span {
      position: relative;
    }
    
    .ce-tag-emoji {
      margin-inline-end: 6px;
    }

    @media(hover: hover) {
      &:hover::before {
        opacity: 1;
      }
    }


  }


}

</style>