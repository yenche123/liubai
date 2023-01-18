<script setup lang="ts">
import ScrollView from './common/scroll-view/scroll-view.vue';
import { useI18n } from 'vue-i18n';

const { t, locale, availableLocales } = useI18n()

const onScrollToEnd = (data: { scrollPosition: number }) => {
  console.log("触底了.......")
  console.log(data)
  console.log(" ")
}

const onChangeLocales = () => {
  console.log("availableLocales: ", availableLocales)
  const cur = locale.value
  const idx = availableLocales.indexOf(cur)
  locale.value = availableLocales[(idx + 1) % availableLocales.length]
}

</script>

<template>
  <scroll-view class="hello-world" @scrolltoend="onScrollToEnd">
    <div class="box">{{ t("hello.world") }}</div>
    <div class="box" style="background: blue" @click="onChangeLocales"></div>
    <div class="box" style="background: yellowgreen"></div>
    <div class="box" style="background: goldenrod"></div>
  </scroll-view>
</template>

<style scoped>

.hello-world {
  width: 60%;
  height: 90vh;
}

.box {
  width: 98%;
  height: 75vh;
  background-color: brown;
}

</style>
