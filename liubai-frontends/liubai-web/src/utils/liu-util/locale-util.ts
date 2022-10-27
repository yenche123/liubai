import { useI18n } from "vue-i18n";


export function getDayNames() {
  const { t } = useI18n()
  const list = [
    t("dayNames.Su"),
    t("dayNames.Mo"),
    t("dayNames.Tu"),
    t("dayNames.We"),
    t("dayNames.Th"),
    t("dayNames.Fr"),
    t("dayNames.Sa"),
  ]
  return list
}