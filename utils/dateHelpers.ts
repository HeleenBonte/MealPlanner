export function getCurrentWeekDates(): string[] {
    const today = new Date();
    const currentDay = today.getDay();

    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMonday);
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        dates.push(formatLocalDate(date));
    }
    return dates;
}

export function getNextWeekDates(): string[] {
    const currentWeekMonday = getCurrentWeekDates()[0];
    const monday = parseLocalDate(currentWeekMonday);
    monday.setDate(monday.getDate() + 7);

    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        dates.push(formatLocalDate(date));
    }
    return dates;
}

function formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function getTodayDateString(): string {
    return formatLocalDate(new Date());
}

function parseLocalDate(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
}

export function getWeekdayIndex(dateString: string): number {
    const sundayBasedIndex = parseLocalDate(dateString).getDay();
    return (sundayBasedIndex + 6) % 7;
}