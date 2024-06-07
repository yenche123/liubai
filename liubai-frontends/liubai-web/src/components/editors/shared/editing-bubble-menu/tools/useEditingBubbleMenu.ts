import type { Instance, Props } from 'tippy.js'
import { inject } from 'vue'
import { deviceChaKey } from '~/utils/provide-keys'

export function useEditingBubbleMenu() {

  let tippy: Instance | undefined = undefined

  const tippyOptions: Partial<Props> = {
    hideOnClick: true,
    placement: 'bottom',
    onMount(instance) {
      tippy = instance
    }
  }

  const cha = inject(deviceChaKey)

  return { tippyOptions, cha }
}