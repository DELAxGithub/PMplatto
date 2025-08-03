import { utcToZonedTime } from 'date-fns-tz';
import { startOfDay } from 'date-fns';

const JST_TIMEZONE = 'Asia/Tokyo';

/**
 * JST（日本標準時）の今日の日付を取得
 * どのタイムゾーンからアクセスしても日本時間での今日を返す
 */
export function getJSTToday(): Date {
  const now = new Date();
  const jstNow = utcToZonedTime(now, JST_TIMEZONE);
  return startOfDay(jstNow);
}



