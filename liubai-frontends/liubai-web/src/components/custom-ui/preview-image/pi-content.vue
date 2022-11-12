<script lang="ts">
import { Swiper } from "swiper"
import { Swiper as VueSwiper, SwiperSlide } from 'swiper/vue';
import { defineComponent } from 'vue';
import type { ImageShow } from '../../../types';
import 'swiper/css';
import { usePiContent } from "./tools/usePiContent";

export default defineComponent({
  components: {
    VueSwiper,
    SwiperSlide,
  },
  props: {
    imgs: {
      type: Array<ImageShow>,
      default: [],
    },
    currentIndex: {
      type: Number,
      default: 0,
    },
  },
  setup(props) {
    const { covers } = usePiContent(props)
    return { covers }
  },
  methods: {
    onSwiper(swiper: Swiper) {
      swiper.activeIndex = this.currentIndex
    },

    onSlideChange() {},
  },
})

</script>
<template>
  <VueSwiper
    @swiper="onSwiper"
    @slideChange="onSlideChange"
  >
    <template v-for="(item, index) in covers" :key="item.id">
      <SwiperSlide>
        <div class="pi-item">
          <liu-img 
            :src="item.src"
            object-fit="contain"
            class="pi-image"
            :style="{ 
              'width': item.width + 'px',
              'height': item.height + 'px',
            }"
            bg-color="#1f1f1f"
          ></liu-img>
        </div>
      </SwiperSlide>
    </template>
  </VueSwiper>
</template>
<style lang="scss">

.pi-item {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-x: hidden;
  overflow-y: auto;

  .pi-image {
    width: 100vw;
    height: 100vh;
    max-width: 100vw;
    max-height: 100vh;
    transition: .2s;
  }

}

</style>