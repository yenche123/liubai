<script lang="ts">
import { Swiper } from "swiper"
import { Swiper as VueSwiper, SwiperSlide } from 'swiper/vue';
import { defineComponent } from 'vue';
import { ImageShow } from '../../../types';
import 'swiper/css';

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
  methods: {
    onSwiper(swiper: Swiper) {
      console.log("onSwiper............")
      console.log("看一下 swiper")
      console.log(swiper)
      console.log(" ")
      
      swiper.activeIndex = this.currentIndex
    },
    onSlideChange() {
      console.log("onSlideChange..............")
    },
  },
})

</script>
<template>
  <VueSwiper
    @swiper="onSwiper"
    @slideChange="onSlideChange"
  >
    <template v-for="(item, index) in imgs" :key="item.id">
      <SwiperSlide>
        <div class="pi-item">
          <liu-img 
            :src="item.src"
            object-fit="contain"
            class="pi-image"
            :style="{ 'height': item.h2w ? 'calc(100vw * ' + item.h2w + ')' : undefined }"
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

  .pi-image {
    width: 100vw;
    height: 100vh;
    max-height: 100vh;
  }

}

</style>