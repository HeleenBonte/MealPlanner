export function getCurrentWeekDates(): string[] {
    const today = new Date();
    const currentDay = today.getDay();

    const distanceToMonday = currentDay === 0 ? -5 : 2 - currentDay;

    const monday = new Date(today.setDate(today.getDate() + distanceToMonday));
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
}