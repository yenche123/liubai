
import { lowlight } from 'lowlight'

export function initLowlight() {

  if(!lowlight.registered("Plain Text")) {
    lowlight.registerAlias({ plaintext: ["Plain Text"] })
  }

}