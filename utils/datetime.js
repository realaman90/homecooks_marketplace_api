const { parseISO, setHours, setMinutes, setSeconds, setMilliseconds } = require('date-fns');
var moment = require('moment-timezone');

function parseWZeroTime(dateStr) {
    let date = parseISO(dateStr);
    date = setHours(date, 0);
    date = setMinutes(date, 0);
    date = setSeconds(date, 0);
    date = setMilliseconds(date, 0);
    return date;
}

function todayDateWithZeroTime() {
    let currDate = new Date();
    return parseWZeroTime(currDate.toISOString());
}

// calDate = "2022-10-22"
// function calDateToPSTDate(calDate){    
//     let date = new Date(calDate);
//     date = date.toLocaleString('en-US', {timeZone: 'America/Los_Angeles'});  
//     date = new Date(date)
//     var timeOffsetInMS = date.getTimezoneOffset() * 60000;
//     date = date.setTime(date.getTime() - timeOffsetInMS);
//     return new Date(date)
// }

// calDate = "2022-10-22"
function calDateToPSTDate(calDate){   
    let dateValArr = calDate.split('-');
    let date = moment().tz("America/Los_Angeles")
    date.set('year', dateValArr[0]);
    date.set('month', dateValArr[1]-1);  // April
    date.set('date', dateValArr[2]);
    date.set('hour', 0);
    date.set('minute', 0);
    date.set('second', 0);
    date.set('millisecond', 0);
    return date.toDate()
}

function PSTDateToCalDate(_date){   
    const date = moment(_date).tz("America/Los_Angeles")
    return `${date.year()}-${date.month()+1}-${date.date()}`
}

module.exports = {
    calDateToPSTDate,
    parseWZeroTime,
    todayDateWithZeroTime,
    PSTDateToCalDate
}