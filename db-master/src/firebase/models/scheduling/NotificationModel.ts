import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../../config';
import { v4 as uuidv4 } from 'uuid';
import { NotificationChannel } from './ScheduledQueryModel';

// 컬렉션 이름
const COLLECTION_NAME = 'notifications';
const USER_PREFERENCES_COLLECTION = 'userNotificationPreferences';

/**
 * 알림 유형
 */
export enum NotificationType {
  QUERY_EXECUTION_SUCCESS = 'QUERY_EXECUTION_SUCCESS',
  QUERY_EXECUTION_ERROR = 'QUERY_EXECUTION_ERROR',
  QUERY_EXECUTION_ALERT = 'QUERY_EXECUTION_ALERT',
  SCHEDULED_QUERY_CREATED = 'SCHEDULED_QUERY_CREATED',
  SCHEDULED_QUERY_MODIFIED = 'SCHEDULED_QUERY_MODIFIED',
}

/**
 * 알림 우선순위
 */
export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

/**
 * 알림 상태
 */
export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  DELETED = 'DELETED',
}

/**
 * Firestore에 저장된 알림 형태
 */
export interface FirestoreNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  scheduledQueryId?: string;
  executionId?: string;
  data?: Record<string, any>;
  sentVia: NotificationChannel[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  readAt?: Timestamp;
}

/**
 * 사용자 알림 환경설정 인터페이스
 */
export interface UserNotificationPreferences {
  userId: string;
  email: {
    enabled: boolean;
    address?: string;
  };
  push: {
    enabled: boolean;
    deviceTokens?: string[];
  };
  scheduleNotifications: boolean;
  alertNotifications: boolean;
  errorNotifications: boolean;
  summaryEmailFrequency: 'NEVER' | 'DAILY' | 'WEEKLY';
  allowedSendTimes?: {
    startHour: number;
    endHour: number;
    timezone: string;
  };
  updatedAt: Timestamp;
}

/**
 * 알림 모델 클래스
 */
export class NotificationModel {
  /**
   * 새 알림 생성
   * @param notification 알림 데이터
   * @returns 생성된 알림의 ID
   */
  static async create(notification: Omit<FirestoreNotification, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string> {
    try {
      // ID 생성
      const notificationId = uuidv4();
      
      // 알림 데이터 준비
      const notificationData: FirestoreNotification = {
        ...notification,
        id: notificationId,
        status: NotificationStatus.UNREAD,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };

      // Firestore에 저장
      const notificationRef = doc(db, COLLECTION_NAME, notificationId);
      await setDoc(notificationRef, notificationData);

      return notificationId;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * 알림 ID로 조회
   * @param id 알림 ID
   * @returns 알림 데이터 또는 null
   */
  static async getById(id: string): Promise<FirestoreNotification | null> {
    try {
      const notificationRef = doc(db, COLLECTION_NAME, id);
      const notificationSnap = await getDoc(notificationRef);

      if (!notificationSnap.exists()) {
        return null;
      }

      return notificationSnap.data() as FirestoreNotification;
    } catch (error) {
      console.error('Error getting notification:', error);
      throw error;
    }
  }

  /**
   * 사용자 알림 목록 조회
   * @param userId 사용자 ID (옵션, 기본값: 현재 사용자)
   * @param status 알림 상태로 필터링 (옵션)
   * @param limit 최대 조회 수
   * @returns 알림 목록
   */
  static async listForUser(
    userId?: string,
    status?: NotificationStatus,
    maxLimit: number = 50
  ): Promise<FirestoreNotification[]> {
    try {
      // 현재 사용자 확인
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // 조회할 사용자 ID 결정
      const targetUserId = userId || currentUser.uid;
      const queryFilters = [where('userId', '==', targetUserId)];
      
      // 상태 필터 (옵션)
      if (status) {
        queryFilters.push(where('status', '==', status));
      }

      // 쿼리 생성
      const notificationsQuery = query(
        collection(db, COLLECTION_NAME),
        ...queryFilters,
        orderBy('createdAt', 'desc'),
        limit(maxLimit)
      );

      // 쿼리 실행
      const snapshot = await getDocs(notificationsQuery);
      
      // 결과 매핑
      const notifications: FirestoreNotification[] = [];
      snapshot.forEach(doc => {
        notifications.push(doc.data() as FirestoreNotification);
      });

      return notifications;
    } catch (error) {
      console.error('Error listing notifications:', error);
      throw error;
    }
  }

  /**
   * 알림 읽음 표시
   * @param id 알림 ID
   */
  static async markAsRead(id: string): Promise<void> {
    try {
      // 현재 사용자 확인
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // 알림 존재 확인 및 접근 권한 검증
      const notification = await this.getById(id);
      if (!notification) {
        throw new Error('Notification not found');
      }

      // 알림 소유자만 읽음 표시 가능
      if (notification.userId !== currentUser.uid) {
        throw new Error('You do not have permission to update this notification');
      }

      // Firestore 업데이트
      const notificationRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(notificationRef, {
        status: NotificationStatus.READ,
        readAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * 모든 알림 읽음 표시
   * @param userId 사용자 ID (옵션, 기본값: 현재 사용자)
   */
  static async markAllAsRead(userId?: string): Promise<void> {
    try {
      // 현재 사용자 확인
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // 조회할 사용자 ID 결정
      const targetUserId = userId || currentUser.uid;
      
      // 권한 검증: 자신의 알림만 처리 가능
      if (targetUserId !== currentUser.uid) {
        throw new Error('You can only update your own notifications');
      }

      // 읽지 않은 알림 조회
      const unreadQuery = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', targetUserId),
        where('status', '==', NotificationStatus.UNREAD)
      );

      const snapshot = await getDocs(unreadQuery);
      
      // 일괄 업데이트 (배치 작업)
      const now = serverTimestamp();
      const batch = db.batch ? db.batch() : null;
      
      if (batch) {
        // Batch API 지원하는 환경
        snapshot.forEach(doc => {
          const notificationRef = doc.ref;
          batch.update(notificationRef, {
            status: NotificationStatus.READ,
            readAt: now,
            updatedAt: now,
          });
        });
        
        await batch.commit();
      } else {
        // Batch API 미지원 환경: 개별 업데이트
        for (const doc of snapshot.docs) {
          const notificationRef = doc.ref;
          await updateDoc(notificationRef, {
            status: NotificationStatus.READ,
            readAt: now,
            updatedAt: now,
          });
        }
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * 알림 삭제
   * @param id 알림 ID
   */
  static async delete(id: string): Promise<void> {
    try {
      // 현재 사용자 확인
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // 알림 존재 확인 및 접근 권한 검증
      const notification = await this.getById(id);
      if (!notification) {
        throw new Error('Notification not found');
      }

      // 알림 소유자만 삭제 가능
      if (notification.userId !== currentUser.uid) {
        throw new Error('You do not have permission to delete this notification');
      }

      // Firestore에서 삭제
      const notificationRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(notificationRef);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * 알림 환경설정 가져오기
   * @param userId 사용자 ID (옵션, 기본값: 현재 사용자)
   * @returns 알림 환경설정 또는 기본값
   */
  static async getPreferences(userId?: string): Promise<UserNotificationPreferences> {
    try {
      // 현재 사용자 확인
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // 조회할 사용자 ID 결정
      const targetUserId = userId || currentUser.uid;
      
      // 권한 검증: 자신의 환경설정만 조회 가능
      if (targetUserId !== currentUser.uid) {
        throw new Error('You can only access your own notification preferences');
      }

      // Firestore에서 환경설정 조회
      const prefRef = doc(db, USER_PREFERENCES_COLLECTION, targetUserId);
      const prefSnap = await getDoc(prefRef);

      if (!prefSnap.exists()) {
        // 기본 환경설정 반환
        return {
          userId: targetUserId,
          email: {
            enabled: true,
            address: currentUser.email || undefined,
          },
          push: {
            enabled: true,
            deviceTokens: [],
          },
          scheduleNotifications: true,
          alertNotifications: true,
          errorNotifications: true,
          summaryEmailFrequency: 'DAILY',
          updatedAt: serverTimestamp() as Timestamp,
        };
      }

      return prefSnap.data() as UserNotificationPreferences;
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      throw error;
    }
  }

  /**
   * 알림 환경설정 업데이트
   * @param preferences 업데이트할 환경설정
   */
  static async updatePreferences(
    preferences: Partial<UserNotificationPreferences>
  ): Promise<void> {
    try {
      // 현재 사용자 확인
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // 현재 환경설정 조회
      const currentPrefs = await this.getPreferences();
      
      // 업데이트 데이터 준비
      const updateData: Partial<UserNotificationPreferences> = {
        ...preferences,
        userId: currentUser.uid,
        updatedAt: serverTimestamp() as Timestamp,
      };

      // Firestore 업데이트
      const prefRef = doc(db, USER_PREFERENCES_COLLECTION, currentUser.uid);
      await setDoc(prefRef, {
        ...currentPrefs,
        ...updateData,
      }, { merge: true });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  /**
   * 읽지 않은 알림 수 조회
   * @param userId 사용자 ID (옵션, 기본값: 현재 사용자)
   * @returns 읽지 않은 알림 수
   */
  static async getUnreadCount(userId?: string): Promise<number> {
    try {
      // 현재 사용자 확인
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // 조회할 사용자 ID 결정
      const targetUserId = userId || currentUser.uid;
      
      // 권한 검증: 자신의 알림만 조회 가능
      if (targetUserId !== currentUser.uid) {
        throw new Error('You can only access your own notifications');
      }

      // 읽지 않은 알림 쿼리
      const unreadQuery = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', targetUserId),
        where('status', '==', NotificationStatus.UNREAD)
      );

      // 쿼리 실행
      const snapshot = await getDocs(unreadQuery);
      
      return snapshot.size;
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      throw error;
    }
  }
}

// 기본 내보내기
export default NotificationModel;
