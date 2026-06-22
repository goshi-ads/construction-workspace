import { TZDate } from "@date-fns/tz";
import {
  addDays,
  differenceInCalendarDays,
  format,
  startOfWeek,
} from "date-fns";
import { ja } from "date-fns/locale";

export const ORG_TZ = "Asia/Tokyo" as const;

export function orgNow(): TZDate {
  return new TZDate(Date.now(), ORG_TZ);
}

export function mondayStartOfWeek(containing: TZDate): TZDate {
  const w = startOfWeek(containing, { weekStartsOn: 1 });
  const m = new TZDate(w.getTime(), ORG_TZ);
  m.setHours(0, 0, 0, 0);
  return m;
}

export function addDaysOrg(d: TZDate, n: number): TZDate {
  return new TZDate(addDays(d, n), ORG_TZ);
}

export function formatTokyoDate(d: Date, pattern: string) {
  return format(new TZDate(d, ORG_TZ), pattern, { locale: ja });
}

export function calendarDayKey(d: Date) {
  return format(new TZDate(d, ORG_TZ), "yyyy-MM-dd");
}

export function isWeekendTokyo(d: Date): boolean {
  const dow = new TZDate(d, ORG_TZ).getDay();
  return dow === 0 || dow === 6;
}

export function dayIndexFromStart(start: TZDate, instant: Date) {
  return differenceInCalendarDays(
    new TZDate(instant, ORG_TZ),
    new TZDate(start.getTime(), ORG_TZ)
  );
}

export function isSameTokyoDay(a: Date, b: Date) {
  return calendarDayKey(a) === calendarDayKey(b);
}

export function timeOfDayFraction(instant: Date, dateOnly: boolean): number {
  if (dateOnly) return 0.5;
  const z = new TZDate(instant, ORG_TZ);
  const h = z.getHours();
  const m = z.getMinutes();
  return Math.min(1, Math.max(0, (h + m / 60) / 24));
}
