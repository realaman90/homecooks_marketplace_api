const { format, parseISO, differenceInCalendarDays, add, getDay, sub, setHours, setMinutes, setSeconds, setMilliseconds } = require('date-fns');

function parseWZeroTime(dateStr) {
    let date = parseISO(dateStr);
    date = setHours(date, 0);
    date = setMinutes(date, 0);
    date = setSeconds(date, 0);
    date = setMilliseconds(date, 0);
    return date;
}

module.exports = {
    parseWZeroTime
}