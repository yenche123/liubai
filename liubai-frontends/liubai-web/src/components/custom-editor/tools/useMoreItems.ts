import { ref } from "vue";



export function useMoreItems() {
  const moreRef = ref(false)

  const onTapMore = () => {
    moreRef.value = !moreRef.value
  }


  return { moreRef, onTapMore }
}