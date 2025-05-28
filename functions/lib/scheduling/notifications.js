"use strict";
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotificationSummary = exports.sendNotification = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const types_1 = require("./types");
const axios_1 = require("axios");
const nodemailer_1 = require("nodemailer");
// 이메일 발송 설정
const EMAIL_SENDER = ((_a = functions.config().email) === null || _a === void 0 ? void 0 : _a.sender) || 'noreply@dbmaster.app';
const SMTP_HOST = ((_b = functions.config().email) === null || _b === void 0 ? void 0 : _b.smtp_host) || 'smtp.gmail.com';
const SMTP_PORT = parseInt(((_c = functions.config().email) === null || _c === void 0 ? void 0 : _c.smtp_port) || '587', 10);
const SMTP_USER = (_d = functions.config().email) === null || _d === void 0 ? void 0 : _d.smtp_user;
const SMTP_PASSWORD = (_e = functions.config().email) === null || _e === void 0 ? void 0 : _e.smtp_password;
// FCM 발송 설정
const FCM_SERVER_KEY = (_f = functions.config().fcm) === null || _f === void 0 ? void 0 : _f.server_key;
/**
 * 알림 발송 함수
 * @param notification 알림 정보
 * @param userId 사용자 ID
 */
async function sendNotification(notification, userId) {
    var _a, _b;
    try {
        if (!notification.channels || notification.channels.length === 0) {
            notification.channels = [types_1.NotificationChannel.EMAIL];
        }
        // 사용자 알림 환경설정 조회
        const preferencesSnapshot = await admin.firestore()
            .collection('userNotificationPreferences')
            .doc(userId)
            .get();
        // 사용자 정보 조회
        const userSnapshot = await admin.firestore().collection('users').doc(userId).get();
        if (!userSnapshot.exists) {
            throw new Error(`User not found: ${userId}`);
        }
        const userInfo = userSnapshot.data();
        const userEmail = userInfo.email;
        // 기본 환경설정
        const defaultPreferences = {
            email: {
                enabled: true,
                address: userEmail
            },
            push: {
                enabled: true,
                deviceTokens: []
            },
            scheduleNotifications: true,
            alertNotifications: true,
            errorNotifications: true,
            summaryEmailFrequency: 'DAILY'
        };
        // 사용자 환경설정 또는 기본값
        const preferences = preferencesSnapshot.exists ?
            preferencesSnapshot.data() :
            defaultPreferences;
        // 알림 타입에 따른 활성화 여부 확인
        let shouldSend = true;
        if (notification.type === 'QUERY_EXECUTION_SUCCESS' && !preferences.scheduleNotifications) {
            shouldSend = false;
        }
        else if (notification.type === 'QUERY_EXECUTION_ALERT' && !preferences.alertNotifications) {
            shouldSend = false;
        }
        else if (notification.type === 'QUERY_EXECUTION_ERROR' && !preferences.errorNotifications) {
            shouldSend = false;
        }
        if (!shouldSend) {
            console.log(`Notification disabled for type ${notification.type} by user preferences`);
            return false;
        }
        // 알림 데이터 준비
        const notificationData = {
            id: admin.firestore().collection('notifications').doc().id,
            userId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            priority: notification.priority || 'MEDIUM',
            status: 'UNREAD',
            sentVia: [],
            scheduledQueryId: (_a = notification.data) === null || _a === void 0 ? void 0 : _a.scheduledQueryId,
            executionId: (_b = notification.data) === null || _b === void 0 ? void 0 : _b.executionId,
            data: notification.data,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        // Firestore에 알림 저장
        await admin.firestore()
            .collection('notifications')
            .doc(notificationData.id)
            .set(notificationData);
        // 각 채널별 알림 발송
        const sendPromises = [];
        // 이메일 알림
        if (notification.channels.includes(types_1.NotificationChannel.EMAIL) && preferences.email.enabled) {
            sendPromises.push(sendEmailNotification(notification, preferences.email.address || userEmail, notification.recipients || []).then(() => {
                // 발송 채널 업데이트
                return admin.firestore()
                    .collection('notifications')
                    .doc(notificationData.id)
                    .update({
                    sentVia: admin.firestore.FieldValue.arrayUnion(types_1.NotificationChannel.EMAIL),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }).catch(error => {
                console.error('Error sending email notification:', error);
            }));
        }
        // 푸시 알림
        if (notification.channels.includes(types_1.NotificationChannel.PUSH) &&
            preferences.push.enabled &&
            preferences.push.deviceTokens &&
            preferences.push.deviceTokens.length > 0) {
            sendPromises.push(sendPushNotification(notification, preferences.push.deviceTokens).then(() => {
                // 발송 채널 업데이트
                return admin.firestore()
                    .collection('notifications')
                    .doc(notificationData.id)
                    .update({
                    sentVia: admin.firestore.FieldValue.arrayUnion(types_1.NotificationChannel.PUSH),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }).catch(error => {
                console.error('Error sending push notification:', error);
            }));
        }
        // 웹훅 알림
        if (notification.channels.includes(types_1.NotificationChannel.WEBHOOK) &&
            notification.webhookConfig &&
            notification.webhookConfig.url) {
            sendPromises.push(sendWebhookNotification(notification).then(() => {
                // 발송 채널 업데이트
                return admin.firestore()
                    .collection('notifications')
                    .doc(notificationData.id)
                    .update({
                    sentVia: admin.firestore.FieldValue.arrayUnion(types_1.NotificationChannel.WEBHOOK),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }).catch(error => {
                console.error('Error sending webhook notification:', error);
            }));
        }
        // 모든 알림 발송 완료 대기
        await Promise.allSettled(sendPromises);
        return true;
    }
    catch (error) {
        console.error('Error sending notification:', error);
        return false;
    }
}
exports.sendNotification = sendNotification;
/**
 * 이메일 알림 발송
 * @param notification 알림 정보
 * @param primaryRecipient 주 수신자
 * @param additionalRecipients 추가 수신자
 */
async function sendEmailNotification(notification, primaryRecipient, additionalRecipients = []) {
    var _a;
    try {
        // SMTP 설정 확인
        if (!SMTP_USER || !SMTP_PASSWORD) {
            throw new Error('SMTP credentials not configured');
        }
        // 수신자 목록 준비
        const allRecipients = [primaryRecipient, ...additionalRecipients].filter(Boolean);
        // 이메일 클라이언트 설정
        const transporter = (0, nodemailer_1.createTransport)({
            host: SMTP_HOST,
            port: SMTP_PORT,
            secure: SMTP_PORT === 465,
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASSWORD,
            },
        });
        // 이메일 내용 준비
        const subject = notification.title;
        const text = notification.message;
        // HTML 형식 (간단한 형식)
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #333; margin-top: 0;">${notification.title}</h2>
        <p style="margin: 15px 0; line-height: 1.5;">${notification.message}</p>
        
        ${((_a = notification.data) === null || _a === void 0 ? void 0 : _a.scheduledQueryId) ? `
          <div style="margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
            <p style="margin: 0 0 10px; font-weight: bold;">Execution Details:</p>
            <p style="margin: 5px 0;">Execution ID: ${notification.data.executionId || 'N/A'}</p>
            ${notification.data.results ? `
              <p style="margin: 10px 0 5px;">Results: ${notification.data.results.length} rows</p>
              ${notification.data.results.length > 0 ? `
                <div style="overflow-x: auto;">
                  <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <thead>
                      <tr style="background-color: #e0e0e0;">
                        ${Object.keys(notification.data.results[0]).map(key => `
                          <th style="padding: 8px; text-align: left; border: 1px solid #ccc;">${key}</th>
                        `).join('')}
                      </tr>
                    </thead>
                    <tbody>
                      ${notification.data.results.slice(0, 5).map(row => `
                        <tr>
                          ${Object.values(row).map(value => `
                            <td style="padding: 8px; border: 1px solid #ccc;">${value !== null ? value : 'NULL'}</td>
                          `).join('')}
                        </tr>
                      `).join('')}
                      ${notification.data.results.length > 5 ? `
                        <tr>
                          <td colspan="${Object.keys(notification.data.results[0]).length}" style="padding: 8px; text-align: center; border: 1px solid #ccc;">
                            ... ${notification.data.results.length - 5} more rows
                          </td>
                        </tr>
                      ` : ''}
                    </tbody>
                  </table>
                </div>
              ` : ''}
            ` : ''}
            ${notification.data.error ? `
              <p style="margin: 10px 0 5px; color: #d32f2f;">Error: ${notification.data.error}</p>
            ` : ''}
          </div>
        ` : ''}
        
        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e0e0e0; font-size: 0.9em; color: #777;">
          <p>This is an automated notification from DB Master. Please do not reply to this email.</p>
        </div>
      </div>
    `;
        // 이메일 발송
        const mailOptions = {
            from: `"DB Master" <${EMAIL_SENDER}>`,
            to: allRecipients.join(', '),
            subject,
            text,
            html,
        };
        await transporter.sendMail(mailOptions);
        console.log(`Email notification sent to ${allRecipients.join(', ')}`);
        return true;
    }
    catch (error) {
        console.error('Error sending email notification:', error);
        throw error;
    }
}
/**
 * 푸시 알림 발송 (Firebase Cloud Messaging)
 * @param notification 알림 정보
 * @param deviceTokens 기기 토큰 목록
 */
async function sendPushNotification(notification, deviceTokens = []) {
    var _a, _b;
    try {
        // 푸시 알림을 보낼 토큰이 있는지 확인
        if (!deviceTokens || deviceTokens.length === 0) {
            throw new Error('No device tokens available');
        }
        // FCM 설정 확인
        if (!FCM_SERVER_KEY) {
            throw new Error('FCM server key not configured');
        }
        // 메시지 데이터 준비
        const message = {
            notification: {
                title: notification.title,
                body: notification.message,
            },
            data: {
                type: notification.type,
                priority: notification.priority,
                scheduledQueryId: ((_a = notification.data) === null || _a === void 0 ? void 0 : _a.scheduledQueryId) || '',
                executionId: ((_b = notification.data) === null || _b === void 0 ? void 0 : _b.executionId) || '',
                timestamp: Date.now().toString(),
            },
            tokens: deviceTokens,
        };
        // FCM 전송
        const response = await admin.messaging().sendMulticast(message);
        console.log(`Push notification sent. Success: ${response.successCount}, Failure: ${response.failureCount}`);
        // 실패한 토큰 처리
        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(deviceTokens[idx]);
                }
            });
            // 실패한 토큰 로깅
            console.log('Failed tokens:', failedTokens);
            // 타임아웃 정보가 있다면 오래된 혹은 잘못된 토큰 제거
            // (실제 구현에서는 해당 토큰을 사용자 설정에서 제거)
        }
        return true;
    }
    catch (error) {
        console.error('Error sending push notification:', error);
        throw error;
    }
}
/**
 * 웹훅 알림 발송
 * @param notification 알림 정보
 */
async function sendWebhookNotification(notification) {
    var _a, _b;
    try {
        const { webhookConfig } = notification;
        if (!webhookConfig || !webhookConfig.url) {
            throw new Error('Webhook configuration missing');
        }
        const { url, method = 'POST', headers = {}, includeResults = false } = webhookConfig;
        // 웹훅 데이터 준비
        const webhookData = {
            type: notification.type,
            title: notification.title,
            message: notification.message,
            priority: notification.priority,
            scheduledQueryId: (_a = notification.data) === null || _a === void 0 ? void 0 : _a.scheduledQueryId,
            executionId: (_b = notification.data) === null || _b === void 0 ? void 0 : _b.executionId,
            timestamp: Date.now(),
        };
        // 결과 포함 옵션
        if (includeResults && notification.data) {
            webhookData.data = notification.data;
        }
        // 웹훅 호출
        let response;
        switch (method.toUpperCase()) {
            case 'GET':
                response = await axios_1.default.get(url, {
                    params: webhookData,
                    headers,
                });
                break;
            case 'PUT':
                response = await axios_1.default.put(url, webhookData, { headers });
                break;
            case 'POST':
            default:
                response = await axios_1.default.post(url, webhookData, { headers });
                break;
        }
        console.log(`Webhook notification sent. Status: ${response.status}`);
        return true;
    }
    catch (error) {
        console.error('Error sending webhook notification:', error);
        throw error;
    }
}
// 알림 요약 이메일 발송 (매일 또는 매주)
exports.sendNotificationSummary = functions.pubsub
    .schedule('every 24 hours')
    .onRun(async (context) => {
    try {
        console.log('Starting notification summary email task');
        // 사용자별 알림 환경설정 조회
        const preferencesSnapshot = await admin.firestore()
            .collection('userNotificationPreferences')
            .get();
        if (preferencesSnapshot.empty) {
            console.log('No user notification preferences found');
            return null;
        }
        // 현재 날짜 및 요일
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0: 일요일, 6: 토요일
        // 각 사용자별 처리
        const promises = preferencesSnapshot.docs.map(async (doc) => {
            var _a, _b;
            const preferences = doc.data();
            const userId = doc.id;
            // 요약 이메일 빈도 확인
            if (preferences.summaryEmailFrequency === 'NEVER') {
                return null;
            }
            if (preferences.summaryEmailFrequency === 'WEEKLY' && dayOfWeek !== 1) {
                // 매주 월요일에만 발송
                return null;
            }
            // 이메일 설정 확인
            if (!((_a = preferences.email) === null || _a === void 0 ? void 0 : _a.enabled) || !((_b = preferences.email) === null || _b === void 0 ? void 0 : _b.address)) {
                return null;
            }
            // 사용자 알림 조회 (지난 24시간 또는 7일)
            const cutoffDate = new Date();
            if (preferences.summaryEmailFrequency === 'DAILY') {
                cutoffDate.setDate(cutoffDate.getDate() - 1); // 1일 전
            }
            else {
                cutoffDate.setDate(cutoffDate.getDate() - 7); // 7일 전
            }
            const cutoffTimestamp = admin.firestore.Timestamp.fromDate(cutoffDate);
            const notificationsSnapshot = await admin.firestore()
                .collection('notifications')
                .where('userId', '==', userId)
                .where('createdAt', '>=', cutoffTimestamp)
                .orderBy('createdAt', 'desc')
                .get();
            if (notificationsSnapshot.empty) {
                return null;
            }
            // 알림 ��룹화
            const notifications = notificationsSnapshot.docs.map(doc => doc.data());
            const groupedNotifications = {
                alerts: notifications.filter(n => n.type === 'QUERY_EXECUTION_ALERT'),
                errors: notifications.filter(n => n.type === 'QUERY_EXECUTION_ERROR'),
                success: notifications.filter(n => n.type === 'QUERY_EXECUTION_SUCCESS'),
                other: notifications.filter(n => n.type !== 'QUERY_EXECUTION_ALERT' &&
                    n.type !== 'QUERY_EXECUTION_ERROR' &&
                    n.type !== 'QUERY_EXECUTION_SUCCESS'),
            };
            // 이메일 내용 생성
            const subject = `DB Master: ${preferences.summaryEmailFrequency === 'DAILY' ? 'Daily' : 'Weekly'} Notification Summary`;
            // 이메일 HTML 템플릿 생성
            const html = generateSummaryEmailTemplate(groupedNotifications, preferences.summaryEmailFrequency);
            // 이메일 발송
            try {
                // SMTP 설정 확인
                if (!SMTP_USER || !SMTP_PASSWORD) {
                    throw new Error('SMTP credentials not configured');
                }
                // 이메일 클라이언트 설정
                const transporter = (0, nodemailer_1.createTransport)({
                    host: SMTP_HOST,
                    port: SMTP_PORT,
                    secure: SMTP_PORT === 465,
                    auth: {
                        user: SMTP_USER,
                        pass: SMTP_PASSWORD,
                    },
                });
                const mailOptions = {
                    from: `"DB Master" <${EMAIL_SENDER}>`,
                    to: preferences.email.address,
                    subject,
                    html,
                };
                await transporter.sendMail(mailOptions);
                console.log(`Summary email sent to ${preferences.email.address}`);
                return { userId, success: true };
            }
            catch (error) {
                console.error(`Error sending summary email to ${preferences.email.address}:`, error);
                return { userId, success: false, error: error.message };
            }
        });
        await Promise.all(promises);
        return null;
    }
    catch (error) {
        console.error('Error in sendNotificationSummary function:', error);
        return null;
    }
});
/**
 * 요약 이메일 템플릿 생성
 * @param groupedNotifications 그룹화된 알림
 * @param frequency 빈도
 * @returns HTML 템플릿
 */
function generateSummaryEmailTemplate(groupedNotifications, frequency) {
    const period = frequency === 'DAILY' ? 'day' : 'week';
    // 알림 건수
    const totalAlerts = groupedNotifications.alerts.length;
    const totalErrors = groupedNotifications.errors.length;
    const totalSuccess = groupedNotifications.success.length;
    const totalOther = groupedNotifications.other.length;
    const totalNotifications = totalAlerts + totalErrors + totalSuccess + totalOther;
    // 템플릿 생성
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #333; margin-top: 0;">DB Master: ${frequency === 'DAILY' ? 'Daily' : 'Weekly'} Notification Summary</h2>
      
      <p style="margin: 15px 0; line-height: 1.5;">You received ${totalNotifications} notifications in the past ${period}.</p>
      
      <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
          <div style="text-align: center; flex: 1;">
            <div style="font-size: 24px; font-weight: bold; color: #f44336;">${totalAlerts}</div>
            <div style="font-size: 14px; color: #555;">Alerts</div>
          </div>
          <div style="text-align: center; flex: 1;">
            <div style="font-size: 24px; font-weight: bold; color: #ff9800;">${totalErrors}</div>
            <div style="font-size: 14px; color: #555;">Errors</div>
          </div>
          <div style="text-align: center; flex: 1;">
            <div style="font-size: 24px; font-weight: bold; color: #4caf50;">${totalSuccess}</div>
            <div style="font-size: 14px; color: #555;">Successful</div>
          </div>
          <div style="text-align: center; flex: 1;">
            <div style="font-size: 24px; font-weight: bold; color: #2196f3;">${totalOther}</div>
            <div style="font-size: 14px; color: #555;">Other</div>
          </div>
        </div>
      </div>
      
      ${totalAlerts > 0 ? `
        <div style="margin-top: 25px;">
          <h3 style="color: #f44336; margin-top: 0;">Alerts</h3>
          <ul style="padding-left: 20px;">
            ${groupedNotifications.alerts.slice(0, 10).map(notification => `
              <li style="margin-bottom: 10px;">
                <div style="font-weight: bold;">${notification.title}</div>
                <div style="font-size: 14px; color: #555;">${notification.message}</div>
                <div style="font-size: 12px; color: #777; margin-top: 5px;">
                  ${new Date(notification.createdAt.toDate()).toLocaleString()}
                </div>
              </li>
            `).join('')}
            ${totalAlerts > 10 ? `<li>And ${totalAlerts - 10} more alerts...</li>` : ''}
          </ul>
        </div>
      ` : ''}
      
      ${totalErrors > 0 ? `
        <div style="margin-top: 25px;">
          <h3 style="color: #ff9800; margin-top: 0;">Errors</h3>
          <ul style="padding-left: 20px;">
            ${groupedNotifications.errors.slice(0, 10).map(notification => `
              <li style="margin-bottom: 10px;">
                <div style="font-weight: bold;">${notification.title}</div>
                <div style="font-size: 14px; color: #555;">${notification.message}</div>
                <div style="font-size: 12px; color: #777; margin-top: 5px;">
                  ${new Date(notification.createdAt.toDate()).toLocaleString()}
                </div>
              </li>
            `).join('')}
            ${totalErrors > 10 ? `<li>And ${totalErrors - 10} more errors...</li>` : ''}
          </ul>
        </div>
      ` : ''}
      
      ${totalSuccess > 0 ? `
        <div style="margin-top: 25px;">
          <h3 style="color: #4caf50; margin-top: 0;">Successful Executions</h3>
          <ul style="padding-left: 20px;">
            ${groupedNotifications.success.slice(0, 5).map(notification => `
              <li style="margin-bottom: 10px;">
                <div style="font-weight: bold;">${notification.title}</div>
                <div style="font-size: 14px; color: #555;">${notification.message}</div>
                <div style="font-size: 12px; color: #777; margin-top: 5px;">
                  ${new Date(notification.createdAt.toDate()).toLocaleString()}
                </div>
              </li>
            `).join('')}
            ${totalSuccess > 5 ? `<li>And ${totalSuccess - 5} more successful executions...</li>` : ''}
          </ul>
        </div>
      ` : ''}
      
      <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e0e0e0; font-size: 0.9em; color: #777;">
        <p>This is an automated summary from DB Master.</p>
        <p>To change your notification preferences, please visit the settings page in the application.</p>
      </div>
    </div>
  `;
}
//# sourceMappingURL=notifications.js.map