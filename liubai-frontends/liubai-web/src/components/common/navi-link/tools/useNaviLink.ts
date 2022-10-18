import { useLink } from 'vue-router'

export function useNaviLink(props: any) {
  const { navigate, href, route: toRouteRe, isActive, isExactActive } = useLink(props)

  const onTapLink = (e: MouseEvent) => {

  }

  return { href, onTapLink, isActive, isExactActive }
}