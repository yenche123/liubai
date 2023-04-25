import { useMyProfile } from "~/hooks/useCommon";


export function useCommentEditor() {

  const { myProfile } = useMyProfile()


  return { myProfile }
}