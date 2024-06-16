import { onBeforeUnmount, onMounted, reactive } from "vue";
import type { IbData } from "./types";
import liuApi from "~/utils/liu-api";

let deferredPrompt: Event | null

export function useIndexBoard() {
  const ibData = reactive<IbData>({
    a2hs: false,
  })

  listenToA2HS(ibData)

  const onTapInstall = () => {

  }
  
  return {
    ibData,
    onTapInstall,
  }
}


function listenToA2HS(
  ibData: IbData,
) {
  const _beforeInstallPrompt = (e: Event) => {
    console.log("beforeinstallprompt.........")
    console.log(e)
    console.log(" ")
    e.preventDefault()

    deferredPrompt = e
    ibData.a2hs = true
  }

  const _appInstalled = () => {
    console.log("PWA was installed !!!!!!!!")
    console.log(" ")
    deferredPrompt = null
    ibData.a2hs = false
  }

  onMounted(() => {
    window.addEventListener("beforeinstallprompt", _beforeInstallPrompt)
    window.addEventListener("appinstalled", _appInstalled)
    handleA2HSForSafari(ibData)
  })

  onBeforeUnmount(() => {
    window.removeEventListener("beforeinstallprompt", _beforeInstallPrompt)
    window.removeEventListener("appinstalled", _appInstalled)
  })
  
}


function handleA2HSForSafari(
  ibData: IbData,
) {

  const cha = liuApi.getCharacteristic()
  if(!cha.isSafari) return
  if(cha.isInWebView) return

  //@ts-expect-error Property only exists on Safari
  const standalone = window.navigator.standalone
  if(typeof standalone !== "boolean") return
  
  ibData.a2hs = !standalone
}


