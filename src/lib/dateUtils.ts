import { addDays, subDays, subWeeks, setDay, addWeeks } from 'date-fns';

/**
 * 完パケ納品日を計算する（初回放送日の1週間前の火曜日）
 * @param firstAirDate 初回放送日
 * @returns 計算された完パケ納品日
 */
export function calculateCompleteDate(firstAirDate: string): string {
  // 文字列をDateオブジェクトに変換
  const airDate = new Date(firstAirDate);
  
  // 1週間前の日付を取得
  let completeDate = subWeeks(airDate, 1);
  
  // 火曜日（2）に設定
  // setDayは0が日曜日、1が月曜日、2が火曜日...
  completeDate = setDay(completeDate, 2);
  
  // もし計算された日付が初回放送日より後の場合、さらに1週間前の火曜日に設定
  if (completeDate >= airDate) {
    completeDate = subWeeks(completeDate, 1);
  }
  
  // YYYY-MM-DD形式の文字列に変換
  return completeDate.toISOString().split('T')[0];
}

/**
 * PR納品日を計算する（初回放送日の2週間前の月曜日）
 * @param firstAirDate 初回放送日
 * @returns 計算されたPR納品日
 */
export function calculatePrDueDate(firstAirDate: string): string {
  // 文字列をDateオブジェクトに変換
  const airDate = new Date(firstAirDate);
  
  // 2週間前の日付を取得
  let prDueDate = subWeeks(airDate, 2);
  
  // 月曜日（1）に設定
  prDueDate = setDay(prDueDate, 1);
  
  // もし計算された日付が初回放送日より後の場合、さらに1週間前の月曜日に設定
  if (prDueDate >= airDate) {
    prDueDate = subWeeks(prDueDate, 1);
  }
  
  // YYYY-MM-DD形式の文字列に変換
  return prDueDate.toISOString().split('T')[0];
}