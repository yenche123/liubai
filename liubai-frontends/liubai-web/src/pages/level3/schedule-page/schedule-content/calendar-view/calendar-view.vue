<script lang="ts" setup>
import { ref } from "vue"
import ThreadList from "~/components/level1/thread-list/thread-list.vue"
import ThreadCard from "~/components/level1/thread-list/thread-card/thread-card.vue"
import ListBottom from "~/components/common/list-bottom/list-bottom.vue"
import { useCalendarView } from "./tools/useCalendarView"
import { useI18n } from "vue-i18n"

const tlRef = ref<any>(null)
const selectedDay = defineModel<Date>("selectedDay", { required: true })

const {
  monthStart,
  nextMonthStart,
  gridDays,
  weekdayLabels,
  monthTitle,
  selectedDayList,
  selectedDayTitle,
  prevMonth,
  nextMonth,
  goToday,
  selectDay,
  isCurrentMonth,
  isToday,
  isSelected,
  hasItems,
  dayMarkerType,
  dayMarkerPieces,
  dayMarkerText,
  dayNum,
} = useCalendarView(tlRef, selectedDay)

const { t } = useI18n()

const onTapDay = (d: Date) => {
  selectDay(d)
}

const onNewOperate = (...args: any[]) => {
  tlRef.value?.receiveOperation?.(...args)
}
const onTapBriefing = (...args: any[]) => {
  tlRef.value?.whenTapBriefing?.(...args)
}
</script>

<template>

  <div class="cv-container">
    <!-- headless 数据引擎：加载整月（本地+云端、分页、增删改响应式） -->
    <thread-list ref="tlRef" :headless="true" view-type="CALENDAR_RANGE"
      :calendar-start="monthStart" :calendar-end="nextMonthStart"
    ></thread-list>

    <div class="cv-shell">
      <section class="cv-calendar" aria-label="calendar">
        <div class="cv-toolbar liu-no-user-select">
          <button class="liu-hover cv-icon-btn" type="button" @click="prevMonth">
            <SvgIcon class="cv-icon" name="arrow-back700"></SvgIcon>
          </button>
          <div class="cv-title">{{ monthTitle }}</div>
          <button class="liu-hover cv-icon-btn" type="button" @click="nextMonth">
            <SvgIcon class="cv-icon cv-icon_right" name="arrow-back700"></SvgIcon>
          </button>
          <button class="liu-hover cv-today" type="button" @click="goToday">
            <span>{{ t("common.today") }}</span>
          </button>
        </div>

        <div class="cv-weekdays liu-no-user-select">
          <div v-for="(w, i) in weekdayLabels" :key="i" class="cv-wd">{{ w }}</div>
        </div>

        <div class="cv-grid">
          <button v-for="(d, i) in gridDays" :key="i"
            class="cv-cell liu-hover"
            type="button"
            :class="{
              'cv-cell--out': !isCurrentMonth(d),
              'cv-cell--today': isToday(d),
              'cv-cell--selected': isSelected(d),
              'cv-cell--has-items': hasItems(d),
            }"
            @click="onTapDay(d)"
          >
            <span class="cv-daynum">{{ dayNum(d) }}</span>
            <span v-if="hasItems(d)"
              class="cv-markers"
              :class="`cv-markers--${dayMarkerType(d)}`"
            >
              <span v-if="dayMarkerType(d) === 'more'" class="cv-marker-more">
                {{ dayMarkerText(d) }}
              </span>
              <span v-else
                v-for="piece in dayMarkerPieces(d)"
                :key="piece"
                class="cv-marker"
              ></span>
            </span>
          </button>
        </div>
      </section>

      <aside class="cv-agenda">
        <div class="cv-agenda-head liu-no-user-select">
          <div class="cv-agenda-date">{{ selectedDayTitle }}</div>
          <div class="cv-agenda-count">
            {{ selectedDayList.length }}
          </div>
        </div>

        <div class="cv-agenda-list">
          <ThreadCard
            v-for="(atom, index) in selectedDayList"
            :key="atom.thread.first_id"
            :thread-data="atom.thread"
            :position="index"
            view-type="CALENDAR_RANGE"
            :show-type="atom.showType"
            @newoperate="onNewOperate"
            @tapbriefing="onTapBriefing"
          ></ThreadCard>
        </div>

        <ListBottom
          :has-data="selectedDayList.length > 0"
          :reached="true"
        ></ListBottom>
      </aside>
    </div>
  </div>

</template>
<style scoped lang="scss">
.cv-container {
  width: 100%;
  box-sizing: border-box;
  container-type: inline-size;
  container-name: calendar-view;
  padding-block: 4px 24px;
}

.cv-shell {
  width: 100%;
  display: grid;
  gap: 14px;
}

.cv-calendar {
  width: 100%;
  box-sizing: border-box;
  border-radius: 8px;
  background-color: var(--card-bg);
  box-shadow: var(--card-shadow-2);
}

.cv-calendar {
  padding: 12px;
}

.cv-toolbar {
  width: 100%;
  min-width: 0;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) 34px max-content;
  align-items: center;
  gap: 8px;
  margin-block-end: 12px;
}

.cv-icon-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  color: var(--main-normal);
}

.cv-icon {
  width: 21px;
  height: 21px;
  color: currentColor;
}

.cv-icon_right {
  transform: rotate(180deg);
}

.cv-title {
  min-width: 0;
  text-align: center;
  font-size: var(--desc-font);
  line-height: 1.2;
  font-weight: 800;
  color: var(--main-text);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.cv-today {
  height: 34px;
  padding-inline: 12px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--mini-font);
  line-height: 1;
  font-weight: 800;
  color: var(--primary-color);
  background-color: color-mix(in srgb, var(--primary-color) 9%, transparent);
}

.cv-weekdays,
.cv-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.cv-weekdays {
  gap: 3px;
  margin-block-end: 4px;
}

.cv-wd {
  min-width: 0;
  height: 26px;
  display: grid;
  place-items: center;
  text-align: center;
  font-size: var(--mini-font);
  line-height: 1;
  font-weight: 800;
  color: var(--main-note);
}

.cv-grid {
  gap: 3px;
  grid-auto-rows: 44px;
}

.cv-cell {
  min-width: 0;
  position: relative;
  border-radius: 8px;
  padding: 0;
  display: grid;
  place-items: center;
  color: var(--main-text);
  background-color: color-mix(in srgb, var(--bg-color) 34%, transparent);
  cursor: pointer;
  transition: background-color .15s, box-shadow .15s, color .15s, opacity .15s;

  .cv-daynum {
    position: relative;
    z-index: 1;
    font-size: var(--btn-font);
    line-height: 1;
    font-weight: 800;
    color: currentColor;
  }

  .cv-markers {
    position: absolute;
    z-index: 1;
    inset-inline: 8px;
    bottom: 4px;
    height: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    color: var(--primary-color);
    pointer-events: none;
  }

  .cv-marker {
    flex: none;
    background-color: currentColor;
  }

  .cv-markers--segment .cv-marker {
    width: 18px;
    height: 4px;
    border-radius: 8px;
  }

  .cv-markers--dot .cv-marker {
    width: 5px;
    height: 5px;
    border-radius: 50%;
  }

  .cv-marker-more {
    min-width: 22px;
    height: 14px;
    padding-inline: 5px;
    border-radius: 8px;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    line-height: 1;
    font-weight: 800;
    color: var(--on-primary);
    background-color: var(--primary-color);
  }
}

.cv-cell--out {
  color: var(--main-note);
  opacity: .42;
}

.cv-cell--today {
  color: var(--primary-color);
  background-color: color-mix(in srgb, var(--primary-color) 8%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--primary-color) 42%, transparent);
}

.cv-cell--selected {
  color: var(--on-primary);
  background-color: var(--primary-color);
  box-shadow: 0 8px 18px -14px var(--primary-color);

  .cv-markers {
    color: var(--on-primary);
  }

  .cv-marker-more {
    color: var(--primary-color);
    background-color: var(--on-primary);
  }
}

.cv-agenda {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.cv-agenda-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-inline: 4px;
  margin-block: 8px 12px;
}

.cv-agenda-date {
  min-width: 0;
  flex: 1;
  font-size: var(--desc-font);
  line-height: 1.3;
  font-weight: 800;
  color: var(--main-text);
}

.cv-agenda-count {
  min-width: 28px;
  height: 28px;
  padding-inline: 8px;
  border-radius: 8px;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  font-size: var(--mini-font);
  line-height: 1;
  font-weight: 800;
  color: var(--primary-color);
  background-color: color-mix(in srgb, var(--primary-color) 9%, transparent);
}

.cv-agenda-list {
  width: 100%;
}

@container calendar-view (min-width: 760px) {
  .cv-grid {
    grid-auto-rows: 50px;
  }
}

@container calendar-view (min-width: 940px) {
  .cv-calendar {
    padding: 16px;
  }

  .cv-grid {
    grid-auto-rows: 54px;
    gap: 4px;
  }

  .cv-weekdays {
    gap: 4px;
  }
}

@container calendar-view (max-width: 380px) {
  .cv-calendar {
    padding: 10px;
  }

  .cv-toolbar {
    grid-template-columns: 30px minmax(0, 1fr) 30px max-content;
    gap: 4px;
    margin-block-end: 8px;
  }

  .cv-icon-btn,
  .cv-today {
    height: 30px;
  }

  .cv-icon-btn {
    width: 30px;
  }

  .cv-icon {
    width: 19px;
    height: 19px;
  }

  .cv-today {
    padding-inline: 8px;
  }

  .cv-grid {
    grid-auto-rows: 40px;
    gap: 2px;
  }

  .cv-weekdays {
    gap: 2px;
  }

  .cv-cell .cv-daynum {
    font-size: var(--mini-font);
  }

  .cv-cell {
    .cv-markers {
      inset-inline: 5px;
      gap: 3px;
    }

    .cv-markers--segment .cv-marker {
      width: 14px;
    }

    .cv-markers--dot .cv-marker {
      width: 4px;
      height: 4px;
    }
  }
}

@media(hover: hover) {
  .cv-cell:hover {
    background-color: var(--card-hover);
  }

  .cv-cell--selected:hover {
    background-color: var(--primary-color);
  }
}
</style>
