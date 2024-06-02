import { getPostHog, getSentry } from "./some-funcs";
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import { type LocalPreference } from "~/utils/system/tools/types";

interface SomeProperties {
  email?: string
}

export async function setSentryUserProperties(
  localP: LocalPreference,
  opt: SomeProperties,
) {
  const userId = localP.local_id
  const open_id = localP.open_id
  if(!open_id) return
  const Sentry = await getSentry()

  // 1. set tags
  Sentry.setTag("liu-theme", localP.theme)
  Sentry.setTag("liu-language", localP.language)
  Sentry.setTag("liu-has-token", Boolean(localP.token))

  // 2. set workspace as context
  const wStore = useWorkspaceStore()
  const spaceId = wStore.spaceId
  const memberId = wStore.memberId
  const spaceType = wStore.spaceType
  const m = wStore.myMember
  const nickname = m?.name

  Sentry.setContext("workspace", {
    spaceId,
    memberId,
    spaceType,
  })

  // 3. if no user
  if(!userId) {
    Sentry.setUser(null)
    return
  }

  // 4. set email & nickName
  Sentry.setUser({
    id: open_id,
    username: nickname,
    email: opt.email,
  })

}

export async function setPostHogUserProperties(
  localP: LocalPreference,
  opt: SomeProperties,
) {
  const open_id = localP.open_id
  if(!open_id) return
  const userId = localP.local_id
  const posthog = await getPostHog()

  const wStore = useWorkspaceStore()
  const spaceId = wStore.spaceId
  const memberId = wStore.memberId
  const spaceType = wStore.spaceType
  const m = wStore.myMember
  const nickname = m?.name

  posthog.group("workspace", spaceId, {
    spaceType,
    memberId,
  })

  posthog.capture("user_profile", {
    $set: {
      "liu-theme": localP.theme,
      "liu-language": localP.language,
      "liu-has-token": Boolean(localP.token),
    },
  })

  if(!userId) {
    posthog.reset()
    return
  }

  posthog.identify(open_id, {
    username: nickname,
    email: opt.email,
  })

}
