"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cronToHumanReadable = exports.getNextExecutionTime = exports.parseAndFormatCronExpression = void 0;
// CRON 표현식 파싱 및 포맷팅 유틸리티
function parseAndFormatCronExpression(cronExpression) {
    try {
        // 기본 유효성 검사
        if (!cronExpression) {
            throw new Error('CRON expression is empty');
        }
        const parts = cronExpression.trim().split(/\s+/);
        // CRON 표현식은 5개 또는 6개 부분으로 구성됨
        // (분 시 일 월 요일 [연]) - 연도는 선택사항
        if (parts.length < 5 || parts.length > 6) {
            throw new Error('Invalid CRON expression format');
        }
        // 각 부분 검증 및 포맷
        const formatted = parts.slice(0, 5).map((part, index) => {
            // 범위 확인
            const ranges = [
                { name: 'minute', min: 0, max: 59 },
                { name: 'hour', min: 0, max: 23 },
                { name: 'day of month', min: 1, max: 31 },
                { name: 'month', min: 1, max: 12 },
                { name: 'day of week', min: 0, max: 6 }
            ];
            // '*' 또는 '?' 등의 특수 문자는 항상 유효
            if (part === '*' || part === '?') {
                return part;
            }
            // 쉼표로 구분된 목록 (예: 1,2,3)
            if (part.includes(',')) {
                const values = part.split(',');
                return values.map(v => validateCronPart(v, ranges[index])).join(',');
            }
            // 범위 (예: 1-5)
            if (part.includes('-')) {
                const [start, end] = part.split('-');
                const startVal = parseInt(start, 10);
                const endVal = parseInt(end, 10);
                if (isNaN(startVal) || isNaN(endVal)) {
                    throw new Error(`Invalid range in ${ranges[index].name}: ${part}`);
                }
                if (startVal < ranges[index].min || startVal > ranges[index].max) {
                    throw new Error(`Start value out of range in ${ranges[index].name}: ${startVal}`);
                }
                if (endVal < ranges[index].min || endVal > ranges[index].max) {
                    throw new Error(`End value out of range in ${ranges[index].name}: ${endVal}`);
                }
                if (startVal > endVal) {
                    throw new Error(`Invalid range in ${ranges[index].name}: start > end`);
                }
                return `${startVal}-${endVal}`;
            }
            // 간격 (예: */5 또는 1/5)
            if (part.includes('/')) {
                const [base, step] = part.split('/');
                const stepVal = parseInt(step, 10);
                if (isNaN(stepVal) || stepVal <= 0) {
                    throw new Error(`Invalid step value in ${ranges[index].name}: ${step}`);
                }
                if (base === '*') {
                    return `*/` + stepVal;
                }
                else {
                    const baseVal = parseInt(base, 10);
                    if (isNaN(baseVal)) {
                        throw new Error(`Invalid base value in ${ranges[index].name}: ${base}`);
                    }
                    if (baseVal < ranges[index].min || baseVal > ranges[index].max) {
                        throw new Error(`Base value out of range in ${ranges[index].name}: ${baseVal}`);
                    }
                    return `${baseVal}/` + stepVal;
                }
            }
            // 단일 값
            return validateCronPart(part, ranges[index]);
        }).join(' ');
        return formatted;
    }
    catch (error) {
        throw new Error(`Invalid CRON expression: ${error.message}`);
    }
}
exports.parseAndFormatCronExpression = parseAndFormatCronExpression;
// CRON 표현식의 개별 부분 검증
function validateCronPart(part, range) {
    // 숫자가 아닌 경우 그대로 반환 (예: L, W, # 등의 특수 문자)
    if (!/^\d+$/.test(part)) {
        return part;
    }
    const value = parseInt(part, 10);
    if (isNaN(value)) {
        throw new Error(`Invalid value in ${range.name}: ${part}`);
    }
    if (value < range.min || value > range.max) {
        throw new Error(`Value out of range in ${range.name}: ${value}`);
    }
    return part;
}
// CRON 표현식의 다음 실행 시간 계산
function getNextExecutionTime(cronExpression, fromDate) {
    // 이 함수는 cron-parser와 같은 라이브러리를 사용하는 것이 이상적입니다.
    // 여기서는 간단한 구현만 제공합니다.
    // 현재 구현에서는 간단한 경우만 처리합니다.
    const now = fromDate || new Date();
    let nextRun = new Date(now);
    try {
        const parts = cronExpression.trim().split(/\s+/);
        if (parts.length < 5) {
            throw new Error('Invalid CRON expression');
        }
        const minute = parts[0];
        const hour = parts[1];
        const dayOfMonth = parts[2];
        const month = parts[3];
        const dayOfWeek = parts[4];
        // 분 설정
        if (minute === '*') {
            // 매분마다 실행: 다음 분으로 설정
            nextRun.setSeconds(0);
            nextRun.setMilliseconds(0);
            nextRun.setMinutes(nextRun.getMinutes() + 1);
        }
        else {
            // 특정 분에 실행
            const minuteValue = parseInt(minute, 10);
            if (nextRun.getMinutes() >= minuteValue) {
                // 이미 지났으면 다음 시간으로
                nextRun.setHours(nextRun.getHours() + 1);
            }
            nextRun.setMinutes(minuteValue);
            nextRun.setSeconds(0);
            nextRun.setMilliseconds(0);
        }
        // 시간 설정
        if (hour !== '*') {
            const hourValue = parseInt(hour, 10);
            if (nextRun.getHours() > hourValue ||
                (nextRun.getHours() === hourValue && nextRun.getMinutes() === 0)) {
                // 이미 지났으면 다음 날로
                nextRun.setDate(nextRun.getDate() + 1);
            }
            nextRun.setHours(hourValue);
        }
        // 여기에 day, month, dayOfWeek에 대한 추가 처리를 구현합니다.
        // 이 부분은 복잡하므로 실제 구현에서는 라이브러리 사용을 권장합니다.
        return nextRun;
    }
    catch (error) {
        throw new Error(`Error calculating next execution time: ${error.message}`);
    }
}
exports.getNextExecutionTime = getNextExecutionTime;
// CRON 표현식을 사람이 읽기 쉬운 형태로 변환
function cronToHumanReadable(cronExpression) {
    try {
        const parts = cronExpression.trim().split(/\s+/);
        if (parts.length < 5) {
            throw new Error('Invalid CRON expression');
        }
        const minute = parts[0];
        const hour = parts[1];
        const dayOfMonth = parts[2];
        const month = parts[3];
        const dayOfWeek = parts[4];
        // 간단한 경우 처리
        // 매분 실행
        if (minute === '*' && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
            return 'Every minute';
        }
        // 매시간 실행
        if (minute !== '*' && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
            if (minute === '0') {
                return 'Every hour';
            }
            else {
                return `Every hour at ${minute} minutes past the hour`;
            }
        }
        // 매일 실행
        if (minute !== '*' && hour !== '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
            const hourValue = parseInt(hour, 10);
            const minuteValue = parseInt(minute, 10);
            const hourStr = hourValue < 12 ?
                (hourValue === 0 ? '12' : hourValue.toString()) + ' AM' :
                (hourValue === 12 ? '12' : (hourValue - 12).toString()) + ' PM';
            return `Every day at ${hourStr}:${minuteValue.toString().padStart(2, '0')}`;
        }
        // 매주 특정 요일 실행
        if (minute !== '*' && hour !== '*' && dayOfMonth === '*' && month === '*' && dayOfWeek !== '*') {
            const hourValue = parseInt(hour, 10);
            const minuteValue = parseInt(minute, 10);
            const hourStr = hourValue < 12 ?
                (hourValue === 0 ? '12' : hourValue.toString()) + ' AM' :
                (hourValue === 12 ? '12' : (hourValue - 12).toString()) + ' PM';
            const daysOfWeek = [
                'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
            ];
            let daysStr = '';
            if (dayOfWeek.includes(',')) {
                // 여러 요일
                const days = dayOfWeek.split(',').map(d => daysOfWeek[parseInt(d, 10)]);
                daysStr = days.join(' and ');
            }
            else if (dayOfWeek.includes('-')) {
                // 요일 범위
                const [start, end] = dayOfWeek.split('-').map(d => parseInt(d, 10));
                daysStr = `${daysOfWeek[start]} through ${daysOfWeek[end]}`;
            }
            else {
                // 단일 요일
                daysStr = daysOfWeek[parseInt(dayOfWeek, 10)];
            }
            return `Every ${daysStr} at ${hourStr}:${minuteValue.toString().padStart(2, '0')}`;
        }
        // 더 복잡한 표현식은 원본 반환
        return `CRON: ${cronExpression}`;
    }
    catch (error) {
        return `Invalid CRON expression: ${cronExpression}`;
    }
}
exports.cronToHumanReadable = cronToHumanReadable;
//# sourceMappingURL=cronExpression.js.map