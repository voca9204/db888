"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupScheduledQueryExecutions = exports.manualExecuteScheduledQuery = exports.executeScheduledQuery = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const database_1 = require("../database");
const types_1 = require("./types");
const notifications_1 = require("./notifications");
// 스케줄링된 쿼리 실행
exports.executeScheduledQuery = functions.pubsub
    .schedule('every 5 minutes')
    .onRun(async (context) => {
    try {
        const now = Date.now();
        const nowTimestamp = admin.firestore.Timestamp.fromMillis(now);
        console.log(`Starting scheduled query execution check at ${new Date(now).toISOString()}`);
        // 1. 활성화된 스케줄링된 쿼리 조회
        const scheduledQuerySnapshot = await admin.firestore()
            .collection('scheduledQueries')
            .where('active', '==', true)
            .get();
        if (scheduledQuerySnapshot.empty) {
            console.log('No active scheduled queries found');
            return null;
        }
        console.log(`Found ${scheduledQuerySnapshot.size} active scheduled queries`);
        // 각 스케줄링된 쿼리에 대해 처리
        const promises = scheduledQuerySnapshot.docs.map(async (doc) => {
            var _a, _b, _c;
            const query = doc.data();
            const { id, schedule, frequency } = query;
            // 2. 실행 시간인지 확인
            if (!shouldExecuteNow(query, now)) {
                return null;
            }
            console.log(`Executing scheduled query: ${id} - ${query.name}`);
            // 3. 실행 기록 생성
            const executionId = await createExecutionRecord(query, nowTimestamp);
            try {
                // 4. 쿼리 실행
                const results = await executeQuery(query);
                // 5. 실행 결과 업데이트
                await updateExecutionRecord(executionId, {
                    status: 'SUCCESS',
                    completionTime: admin.firestore.Timestamp.now(),
                    results: results.rows || [],
                    resultCount: ((_a = results.rows) === null || _a === void 0 ? void 0 : _a.length) || 0,
                    executionTime_ms: results.executionTime,
                });
                // 6. 마지막 실행 상태 업데이트
                await updateLastExecutionStatus(id, 'SUCCESS', nowTimestamp);
                // 7. 알림 조건 확인 및 알림 생성
                if ((_b = query.notifications) === null || _b === void 0 ? void 0 : _b.enabled) {
                    const shouldNotify = checkAlertConditions(query, results);
                    if (shouldNotify) {
                        await createAndSendNotification(query, executionId, results, shouldNotify);
                        // 알림 전송 상태 업데이트
                        await updateExecutionRecord(executionId, {
                            notificationSent: true,
                            notificationStatus: 'SENT',
                            alertTriggered: shouldNotify.triggered,
                            alertReason: shouldNotify.reason,
                        });
                    }
                }
                console.log(`Successfully executed scheduled query: ${id}`);
                return { id, success: true };
            }
            catch (error) {
                console.error(`Error executing scheduled query ${id}:`, error);
                // 실행 실패 기록 업데이트
                await updateExecutionRecord(executionId, {
                    status: 'ERROR',
                    completionTime: admin.firestore.Timestamp.now(),
                    error: error.message || 'Unknown error',
                });
                // 마지막 실행 상태 업데이트
                await updateLastExecutionStatus(id, 'ERROR', nowTimestamp);
                // 오류 알림 전송
                if ((_c = query.notifications) === null || _c === void 0 ? void 0 : _c.enabled) {
                    const shouldNotify = {
                        triggered: true,
                        reason: 'Query execution failed',
                        condition: {
                            type: types_1.AlertConditionType.ERROR
                        }
                    };
                    await createAndSendNotification(query, executionId, { error: error.message }, shouldNotify);
                    await updateExecutionRecord(executionId, {
                        notificationSent: true,
                        notificationStatus: 'SENT',
                        alertTriggered: true,
                        alertReason: 'Execution failed',
                    });
                }
                return { id, success: false, error: error.message };
            }
        });
        await Promise.all(promises);
        return null;
    }
    catch (error) {
        console.error('Error in executeScheduledQuery function:', error);
        return null;
    }
});
// 특정 스케줄링된 쿼리 강제 실행
exports.manualExecuteScheduledQuery = functions.https.onCall(async (data, context) => {
    var _a, _b, _c, _d;
    // 인증 확인
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    const { scheduledQueryId } = data;
    if (!scheduledQueryId) {
        throw new functions.https.HttpsError('invalid-argument', 'Scheduled query ID is required');
    }
    try {
        // 스케줄링된 쿼리 정보 조회
        const querySnapshot = await admin.firestore()
            .collection('scheduledQueries')
            .doc(scheduledQueryId)
            .get();
        if (!querySnapshot.exists) {
            throw new functions.https.HttpsError('not-found', 'Scheduled query not found');
        }
        const query = querySnapshot.data();
        // 권한 확인
        if (query.createdBy !== context.auth.uid) {
            throw new functions.https.HttpsError('permission-denied', 'You do not have permission to execute this query');
        }
        const now = Date.now();
        const nowTimestamp = admin.firestore.Timestamp.fromMillis(now);
        // 실행 기록 생성
        const executionId = await createExecutionRecord(query, nowTimestamp);
        try {
            // 쿼리 실행
            const results = await executeQuery(query);
            // 실행 결과 업데이트
            await updateExecutionRecord(executionId, {
                status: 'SUCCESS',
                completionTime: admin.firestore.Timestamp.now(),
                results: results.rows || [],
                resultCount: ((_a = results.rows) === null || _a === void 0 ? void 0 : _a.length) || 0,
                executionTime_ms: results.executionTime,
            });
            // 마지막 실행 상태 업데이트
            await updateLastExecutionStatus(scheduledQueryId, 'SUCCESS', nowTimestamp);
            // 알림 조건 확인 및 알림 생성
            if ((_b = query.notifications) === null || _b === void 0 ? void 0 : _b.enabled) {
                const shouldNotify = checkAlertConditions(query, results);
                if (shouldNotify) {
                    await createAndSendNotification(query, executionId, results, shouldNotify);
                    // 알림 전송 상태 업데이트
                    await updateExecutionRecord(executionId, {
                        notificationSent: true,
                        notificationStatus: 'SENT',
                        alertTriggered: shouldNotify.triggered,
                        alertReason: shouldNotify.reason,
                    });
                }
            }
            return {
                success: true,
                executionId,
                results: {
                    rows: results.rows || [],
                    count: ((_c = results.rows) === null || _c === void 0 ? void 0 : _c.length) || 0,
                    executionTime: results.executionTime,
                }
            };
        }
        catch (error) {
            console.error(`Error manually executing scheduled query ${scheduledQueryId}:`, error);
            // 실행 실패 기록 업데이트
            await updateExecutionRecord(executionId, {
                status: 'ERROR',
                completionTime: admin.firestore.Timestamp.now(),
                error: error.message || 'Unknown error',
            });
            // 마지막 실행 상태 업데이트
            await updateLastExecutionStatus(scheduledQueryId, 'ERROR', nowTimestamp);
            // 오류 알림 전송
            if ((_d = query.notifications) === null || _d === void 0 ? void 0 : _d.enabled) {
                const shouldNotify = {
                    triggered: true,
                    reason: 'Query execution failed',
                    condition: {
                        type: types_1.AlertConditionType.ERROR
                    }
                };
                await createAndSendNotification(query, executionId, { error: error.message }, shouldNotify);
                await updateExecutionRecord(executionId, {
                    notificationSent: true,
                    notificationStatus: 'SENT',
                    alertTriggered: true,
                    alertReason: 'Execution failed',
                });
            }
            throw new functions.https.HttpsError('internal', `Error executing query: ${error.message}`);
        }
    }
    catch (error) {
        console.error('Error in manualExecuteScheduledQuery function:', error);
        throw new functions.https.HttpsError('internal', `Internal server error: ${error.message}`);
    }
});
// 스케줄링된 쿼리 자동 정리 (오래된 실행 기록 삭제)
exports.cleanupScheduledQueryExecutions = functions.pubsub
    .schedule('every 24 hours')
    .onRun(async (context) => {
    try {
        console.log('Starting scheduled query execution cleanup');
        // 1. 모든 스케줄링된 쿼리 조회
        const scheduledQuerySnapshot = await admin.firestore()
            .collection('scheduledQueries')
            .get();
        if (scheduledQuerySnapshot.empty) {
            console.log('No scheduled queries found');
            return null;
        }
        // 각 스케줄링된 쿼리에 대해 처리
        const promises = scheduledQuerySnapshot.docs.map(async (doc) => {
            const query = doc.data();
            const { id, maxHistoryRetention } = query;
            // 기본값: 30일
            const retention = maxHistoryRetention || 30;
            // 보존 기간보다 오래된 기록 삭제
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - retention);
            const cutoffTimestamp = admin.firestore.Timestamp.fromDate(cutoffDate);
            // 오래된 실행 기록 조회
            const oldExecutionsSnapshot = await admin.firestore()
                .collection('scheduledQueryExecutions')
                .where('scheduledQueryId', '==', id)
                .where('executionTime', '<', cutoffTimestamp)
                .get();
            if (oldExecutionsSnapshot.empty) {
                return null;
            }
            console.log(`Deleting ${oldExecutionsSnapshot.size} old execution records for query ${id}`);
            // 배치 작업으로 삭제
            const batchSize = 500; // Firestore 최대 배치 크기
            const batches = [];
            for (let i = 0; i < oldExecutionsSnapshot.size; i += batchSize) {
                const batch = admin.firestore().batch();
                oldExecutionsSnapshot.docs
                    .slice(i, i + batchSize)
                    .forEach(doc => {
                    batch.delete(doc.ref);
                });
                batches.push(batch.commit());
            }
            await Promise.all(batches);
            return { id, deletedCount: oldExecutionsSnapshot.size };
        });
        const results = await Promise.all(promises);
        const totalDeleted = results.reduce((sum, result) => {
            return sum + ((result === null || result === void 0 ? void 0 : result.deletedCount) || 0);
        }, 0);
        console.log(`Cleanup completed. Deleted ${totalDeleted} old execution records`);
        return null;
    }
    catch (error) {
        console.error('Error in cleanupScheduledQueryExecutions function:', error);
        return null;
    }
});
/**
 * 현재 시간에 실행해야 하는지 확인
 * @param query 스케줄링된 쿼리
 * @param now 현재 시간
 * @returns true/false
 */
function shouldExecuteNow(query, now) {
    var _a;
    const { frequency, schedule, lastExecutionAt } = query;
    // 비활성화된 쿼리 건너뛰기
    if (!query.active) {
        return false;
    }
    // 시작 시간 이전이면 건너뛰기
    if (schedule.startTime && schedule.startTime.toMillis() > now) {
        return false;
    }
    // 종료 시간 이후면 건너뛰기
    if (schedule.endTime && schedule.endTime.toMillis() < now) {
        return false;
    }
    // 마지막 실행 시간
    const lastExecution = lastExecutionAt ? lastExecutionAt.toMillis() : 0;
    // 현재 시간 기준 정보
    const currentDate = new Date(now);
    const currentHour = currentDate.getHours();
    const currentMinute = currentDate.getMinutes();
    const currentDayOfWeek = currentDate.getDay(); // 0: 일요일, 6: 토요일
    const currentDayOfMonth = currentDate.getDate(); // 1-31
    // 빈도에 따른 처리
    switch (frequency) {
        case 'ONCE':
            // 한 번만 실행: 마지막 실행이 없는 경우만 실행
            return !lastExecutionAt;
        case 'HOURLY':
            // 매시간 실행: 마지막 실행이 1시간 이전이고, 지정된 분에 실행
            const hourInterval = 60 * 60 * 1000; // 1시간 (밀리초)
            return (now - lastExecution >= hourInterval &&
                currentMinute === (schedule.minute || 0));
        case 'DAILY':
            // 매일 실행: 마지막 실행이 1일 이전이고, 지정된 시간에 실행
            const dayInterval = 24 * 60 * 60 * 1000; // 1일 (밀리초)
            return (now - lastExecution >= dayInterval &&
                currentHour === (schedule.hour || 0) &&
                currentMinute === (schedule.minute || 0));
        case 'WEEKLY':
            // 매주 실행: 마지막 실행이 1주 이전이고, 지정된 요일과 시간에 실행
            const weekInterval = 7 * 24 * 60 * 60 * 1000; // 1주 (밀리초)
            return (now - lastExecution >= weekInterval &&
                ((_a = schedule.daysOfWeek) === null || _a === void 0 ? void 0 : _a.includes(currentDayOfWeek)) &&
                currentHour === (schedule.hour || 0) &&
                currentMinute === (schedule.minute || 0));
        case 'MONTHLY':
            // 매월 실행: 마지막 실행이 1달 이전이고, 지정된 날짜와 시간에 실행
            const lastExecutionDate = lastExecution ? new Date(lastExecution) : new Date(0);
            const isNewMonth = (currentDate.getFullYear() > lastExecutionDate.getFullYear() ||
                (currentDate.getFullYear() === lastExecutionDate.getFullYear() &&
                    currentDate.getMonth() > lastExecutionDate.getMonth()));
            return (isNewMonth &&
                currentDayOfMonth === (schedule.dayOfMonth || 1) &&
                currentHour === (schedule.hour || 0) &&
                currentMinute === (schedule.minute || 0));
        case 'CUSTOM':
            // CRON 표현식 사용: 마지막 실행 이후 최소 4분 경과
            if (now - lastExecution < 4 * 60 * 1000) {
                return false;
            }
            if (!schedule.cronExpression) {
                return false;
            }
            try {
                return isCronMatch(schedule.cronExpression, currentDate);
            }
            catch (error) {
                console.error(`Error evaluating CRON expression for query ${query.id}:`, error);
                return false;
            }
        default:
            return false;
    }
}
/**
 * CRON 표현식이 현재 시간과 일치하는지 확인
 * @param cronExpression CRON 표현식
 * @param date 확인할 시간
 * @returns true/false
 */
function isCronMatch(cronExpression, date) {
    try {
        // 간단한 CRON 구현 (실제 운영 환경에서는 라이브러리 사용 권장)
        const parts = cronExpression.split(' ');
        if (parts.length !== 5) {
            throw new Error('Invalid CRON expression');
        }
        const minute = parts[0];
        const hour = parts[1];
        const dayOfMonth = parts[2];
        const month = parts[3];
        const dayOfWeek = parts[4];
        // 현재 시간 정보
        const currMinute = date.getMinutes();
        const currHour = date.getHours();
        const currDayOfMonth = date.getDate();
        const currMonth = date.getMonth() + 1; // JavaScript: 0-11, CRON: 1-12
        const currDayOfWeek = date.getDay(); // JavaScript: 0-6 (일-토)
        // 각 부분이 일치하는지 확인
        return (isFieldMatch(minute, currMinute, 0, 59) &&
            isFieldMatch(hour, currHour, 0, 23) &&
            isFieldMatch(dayOfMonth, currDayOfMonth, 1, 31) &&
            isFieldMatch(month, currMonth, 1, 12) &&
            isFieldMatch(dayOfWeek, currDayOfWeek, 0, 6));
    }
    catch (error) {
        console.error('Error in isCronMatch:', error);
        return false;
    }
}
/**
 * CRON 필드가 일치하는지 확인
 * @param field CRON 필드
 * @param value 현재 값
 * @param min 최소값
 * @param max 최대값
 * @returns true/false
 */
function isFieldMatch(field, value, min, max) {
    // '*'인 경우 항상 일치
    if (field === '*') {
        return true;
    }
    // 쉼표로 구분된 목록 (1,2,3)
    if (field.includes(',')) {
        return field
            .split(',')
            .some(f => isFieldMatch(f.trim(), value, min, max));
    }
    // 범위 (1-5)
    if (field.includes('-')) {
        const [start, end] = field.split('-').map(f => parseInt(f.trim(), 10));
        return value >= start && value <= end;
    }
    // 간격 (*/5, 1/5)
    if (field.includes('/')) {
        const [range, interval] = field.split('/');
        const intervalValue = parseInt(interval.trim(), 10);
        if (range === '*') {
            return (value - min) % intervalValue === 0;
        }
        else {
            const rangeValue = parseInt(range.trim(), 10);
            return value >= rangeValue && (value - rangeValue) % intervalValue === 0;
        }
    }
    // 단일 값
    return parseInt(field, 10) === value;
}
/**
 * 실행 기록 생성
 * @param query 스케줄링된 쿼리
 * @param executionTime 실행 시간
 * @returns 실행 ID
 */
async function createExecutionRecord(query, executionTime) {
    const executionId = admin.firestore().collection('scheduledQueryExecutions').doc().id;
    const executionData = {
        id: executionId,
        scheduledQueryId: query.id,
        connectionId: query.connectionId,
        executionTime,
        status: 'RUNNING',
        sql: query.sql,
        parameters: query.parameters || [],
        notificationSent: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await admin.firestore()
        .collection('scheduledQueryExecutions')
        .doc(executionId)
        .set(executionData);
    return executionId;
}
/**
 * 실행 기록 업데이트
 * @param executionId 실행 ID
 * @param data 업데이트 데이터
 */
async function updateExecutionRecord(executionId, data) {
    await admin.firestore()
        .collection('scheduledQueryExecutions')
        .doc(executionId)
        .update(data);
}
/**
 * 마지막 실행 상태 업데이트
 * @param queryId 쿼리 ID
 * @param status 실행 상태
 * @param executionTime 실행 시간
 */
async function updateLastExecutionStatus(queryId, status, executionTime) {
    await admin.firestore()
        .collection('scheduledQueries')
        .doc(queryId)
        .update({
        lastExecutionStatus: status,
        lastExecutionAt: executionTime,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}
/**
 * 쿼리 실행
 * @param query 스케줄링된 쿼리
 * @returns 쿼리 결과
 */
async function executeQuery(query) {
    const { connectionId, sql, parameters = [] } = query;
    // 연결 정보 조회
    const connectionData = await (0, database_1.getConnection)(query.createdBy, connectionId);
    // 데이터베이스 연결
    const connection = await (0, database_1.createConnection)(connectionData.host, connectionData.port, connectionData.user, connectionData.password, connectionData.database, connectionData.ssl);
    // 실행 시작 시간
    const startTime = Date.now();
    try {
        // 파라미터 값 추출
        const paramValues = parameters.map(p => p.value);
        // 쿼리 실행
        const [rows, fields] = await connection.execute(sql, paramValues);
        // 실행 시간 계산
        const executionTime = Date.now() - startTime;
        // 연결 종료
        await connection.end();
        return {
            rows,
            fields: fields ? fields.map((field) => ({
                name: field.name,
                type: field.type,
            })) : [],
            executionTime,
        };
    }
    catch (error) {
        // 연결 종료
        try {
            await connection.end();
        }
        catch (e) {
            console.error('Error closing connection:', e);
        }
        throw error;
    }
}
/**
 * 알림 조건 확인
 * @param query 스케줄링된 쿼리
 * @param results 쿼리 결과
 * @returns 알림 생성 여부
 */
function checkAlertConditions(query, results) {
    var _a;
    const { notifications } = query;
    // 알림 비활성화
    if (!notifications || !notifications.enabled) {
        return false;
    }
    // 알림 조건이 없는 경우
    if (!notifications.alertConditions || notifications.alertConditions.length === 0) {
        // 기본 조건: 항상 알림
        return {
            triggered: true,
            reason: 'Query executed successfully',
            condition: {
                type: types_1.AlertConditionType.ALWAYS
            }
        };
    }
    // 오류 발생 시
    if (results.error) {
        return {
            triggered: true,
            reason: `Query execution failed: ${results.error}`,
            condition: {
                type: types_1.AlertConditionType.ERROR
            }
        };
    }
    // 알림 조건 검사
    for (const condition of notifications.alertConditions) {
        switch (condition.type) {
            case types_1.AlertConditionType.ALWAYS:
                // 항상 알림
                return {
                    triggered: true,
                    reason: 'Query executed successfully',
                    condition
                };
            case types_1.AlertConditionType.NO_RESULTS:
                // 결과가 없을 때
                if (!results.rows || results.rows.length === 0) {
                    return {
                        triggered: true,
                        reason: 'Query returned no results',
                        condition
                    };
                }
                break;
            case types_1.AlertConditionType.ROWS_COUNT:
                // 행 수 조건
                if (condition.operator && typeof condition.value === 'number') {
                    const rowCount = ((_a = results.rows) === null || _a === void 0 ? void 0 : _a.length) || 0;
                    if (compareValues(rowCount, condition.value, condition.operator)) {
                        return {
                            triggered: true,
                            reason: `Row count ${getOperatorText(condition.operator)} ${condition.value}`,
                            condition
                        };
                    }
                }
                break;
            case types_1.AlertConditionType.CUSTOM_CONDITION:
                // 사용자 정의 조건
                if (condition.columnName && condition.operator && results.rows && results.rows.length > 0) {
                    // 지정된 컬럼이 있는지 확인
                    const columnValues = results.rows.map(row => row[condition.columnName]);
                    if (columnValues.length > 0) {
                        // 값들이 조건을 만족하는지 확인
                        const someMatch = columnValues.some(value => compareValues(value, condition.value, condition.operator));
                        if (someMatch) {
                            return {
                                triggered: true,
                                reason: `Column '${condition.columnName}' has values ${getOperatorText(condition.operator)} ${condition.value}`,
                                condition
                            };
                        }
                    }
                }
                break;
            case types_1.AlertConditionType.ERROR:
                // 오류 발생 시 (이미 위에서 처리)
                break;
            default:
                break;
        }
    }
    // 어떤 조건도 만족하지 않음
    return false;
}
/**
 * 값 비교
 * @param actual 실제 값
 * @param expected 기대 값
 * @param operator 비교 연산자
 * @returns 비교 결과
 */
function compareValues(actual, expected, operator) {
    // 타입 변환 (필요한 경우)
    if (typeof actual === 'string' && typeof expected === 'number') {
        actual = parseFloat(actual);
    }
    else if (typeof expected === 'string' && typeof actual === 'number') {
        expected = parseFloat(expected);
    }
    // 비교
    switch (operator) {
        case types_1.ComparisonOperator.EQUAL:
            return actual == expected;
        case types_1.ComparisonOperator.NOT_EQUAL:
            return actual != expected;
        case types_1.ComparisonOperator.GREATER_THAN:
            return actual > expected;
        case types_1.ComparisonOperator.LESS_THAN:
            return actual < expected;
        case types_1.ComparisonOperator.GREATER_THAN_OR_EQUAL:
            return actual >= expected;
        case types_1.ComparisonOperator.LESS_THAN_OR_EQUAL:
            return actual <= expected;
        default:
            return false;
    }
}
/**
 * 연산자 텍스트 변환
 * @param operator 비교 연산자
 * @returns 텍스트
 */
function getOperatorText(operator) {
    switch (operator) {
        case types_1.ComparisonOperator.EQUAL:
            return 'equals';
        case types_1.ComparisonOperator.NOT_EQUAL:
            return 'does not equal';
        case types_1.ComparisonOperator.GREATER_THAN:
            return 'is greater than';
        case types_1.ComparisonOperator.LESS_THAN:
            return 'is less than';
        case types_1.ComparisonOperator.GREATER_THAN_OR_EQUAL:
            return 'is greater than or equal to';
        case types_1.ComparisonOperator.LESS_THAN_OR_EQUAL:
            return 'is less than or equal to';
        default:
            return 'matches condition';
    }
}
/**
 * 알림 생성 및 전송
 * @param query 스케줄링된 쿼리
 * @param executionId 실행 ID
 * @param results 쿼리 결과
 * @param alertInfo 알림 정보
 */
async function createAndSendNotification(query, executionId, results, alertInfo) {
    try {
        const { id, name, notifications } = query;
        const { reason, condition } = alertInfo;
        // 알림 제목
        const title = alertInfo.triggered ?
            `Alert: ${name}` :
            `Scheduled query executed: ${name}`;
        // 알림 메시지
        let message = alertInfo.triggered ?
            `Alert triggered for query "${name}": ${reason}` :
            `Scheduled query "${name}" executed successfully`;
        // 결과 요약 추가
        if (results.rows && !results.error) {
            message += `. Returned ${results.rows.length} rows`;
            // 결과 예시 (최대 3개 행)
            if (results.rows.length > 0) {
                message += `. Sample results: ${JSON.stringify(results.rows.slice(0, 3))}`;
            }
        }
        else if (results.error) {
            message += `. Error: ${results.error}`;
        }
        // 알림 타입
        const notificationType = alertInfo.triggered ?
            (condition.type === types_1.AlertConditionType.ERROR ?
                'QUERY_EXECUTION_ERROR' : 'QUERY_EXECUTION_ALERT') :
            'QUERY_EXECUTION_SUCCESS';
        // 알림 생성 및 전송
        const notificationChannels = notifications.channels || [types_1.NotificationChannel.EMAIL];
        // 이메일 수신자
        const recipients = notifications.recipients || [];
        // 웹훅 설정
        const webhookConfig = notifications.webhookConfig;
        // 각 채널별 알림 전송
        await (0, notifications_1.sendNotification)({
            type: notificationType,
            title,
            message,
            priority: alertInfo.triggered ? 'HIGH' : 'MEDIUM',
            recipients,
            channels: notificationChannels,
            webhookConfig,
            data: {
                scheduledQueryId: id,
                executionId,
                condition: alertInfo.condition,
                reason: alertInfo.reason,
                results: results.rows ?
                    (results.rows.length > 10 ? results.rows.slice(0, 10) : results.rows) :
                    [],
                error: results.error,
            }
        }, query.createdBy);
        return true;
    }
    catch (error) {
        console.error('Error creating and sending notification:', error);
        return false;
    }
}
//# sourceMappingURL=functions.js.map