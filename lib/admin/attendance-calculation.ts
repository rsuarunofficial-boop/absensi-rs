export function minutesBetween(later: number, earlier: number) {
  return Math.max(0, Math.ceil((later - earlier) / 60_000));
}

export function getExpectedTimestamp(
  date: string,
  time: string,
  nextDay = false
) {
  const [year, month, day] = date.split("-").map(Number);
  const localDate = new Date(
    Date.UTC(year, month - 1, day + (nextDay ? 1 : 0))
  )
    .toISOString()
    .slice(0, 10);
  return Date.parse(`${localDate}T${time}:00+07:00`);
}
