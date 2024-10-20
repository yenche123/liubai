import { defineStore } from "pinia";
import { useDateFormat, useNow } from "../useVueUse";

export const useDateStore = defineStore("date", () => {

  const date = useDateFormat(useNow(), "YYYY-MM-DD")
  const hour = useDateFormat(useNow(), "YYYY-MM-DD HH")
  const minute = useDateFormat(useNow(), "YYYY-MM-DD HH:mm")
  
  return {
    date,
    hour,
    minute,
  }
})