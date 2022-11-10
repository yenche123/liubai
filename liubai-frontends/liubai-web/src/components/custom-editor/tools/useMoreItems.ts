import { computed, ref } from "vue";

interface CustomEditorProps {
  lastBar: boolean
}

export function useMoreItems(props: CustomEditorProps) {
  const moreRef = ref(false)
  
  const onTapMore = () => {
    moreRef.value = !moreRef.value
  }

  const showVirtualBar = computed(() => {
    if(props.lastBar) return true
    if(moreRef.value) return true
    return false
  })


  return { moreRef, onTapMore, showVirtualBar }
}