import { type PageState } from "~/types/types-atom"

export const pageStates: Record<string, PageState> = {
  OK: -1,
  LOADING: 0,
  SWITCHING: 1,
  NO_DATA: 50,
  NO_AUTH: 51,
  NETWORK_ERR: 52,
  NEED_BACKEND: 53,
}