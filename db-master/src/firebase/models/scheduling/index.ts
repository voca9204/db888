import ScheduledQueryModel, { 
  ScheduleFrequency, 
  NotificationChannel, 
  AlertConditionType,
  ComparisonOperator,
  AlertCondition,
  WebhookConfig,
  FirestoreScheduledQuery,
  FirestoreQueryExecution
} from './ScheduledQueryModel';

import NotificationModel, {
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  FirestoreNotification,
  UserNotificationPreferences
} from './NotificationModel';

export {
  // Scheduled Query
  ScheduledQueryModel,
  ScheduleFrequency,
  NotificationChannel,
  AlertConditionType,
  ComparisonOperator,
  
  // Interfaces
  AlertCondition,
  WebhookConfig,
  FirestoreScheduledQuery,
  FirestoreQueryExecution,
  
  // Notification
  NotificationModel,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  FirestoreNotification,
  UserNotificationPreferences
};

export default {
  ScheduledQueryModel,
  NotificationModel
};
