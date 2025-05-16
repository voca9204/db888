import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../config';
import { QueryTemplateModel } from './QueryTemplateModel';
import { v4 as uuidv4 } from 'uuid';

// 컬렉션 이름
const COLLECTION_NAME = 'queryTemplateShares';

/**
 * 공유 권한 타입
 */
export enum SharePermission {
  READ = 'read',        // 읽기만 가능
  EXECUTE = 'execute',  // 실행 가능
  MODIFY = 'modify',    // 수정 가능
  ADMIN = 'admin'       // 모든 권한 (공유 포함)
}

/**
 * Firestore에 저장된 쿼리 템플릿 공유 데이터 구조
 */
export interface FirestoreQueryTemplateShare {
  id: string;
  templateId: string;
  ownerId: string;
  sharedWith: string; // 공유 대상 이메일
  permission: SharePermission;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  message?: string; // 공유 시 남긴 메시지
  isAccepted: boolean; // 공유 수락 여부
}

/**
 * 쿼리 템플릿 공유 모델 클래스
 */
export class QueryTemplateShareModel {
  /**
   * 템플릿 공유 생성
   * @param templateId 템플릿 ID
   * @param email 공유 대상 사용자 이메일
   * @param permission 권한
   * @param message 공유 메시지 (옵션)
   * @returns 생성된 공유 ID
   */
  static async create(
    templateId: string, 
    email: string, 
    permission: SharePermission = SharePermission.READ,
    message?: string
  ): Promise<string> {
    try {
      // 현재 사용자 확인
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // 템플릿 존재 확인 및 접근 권한 검증
      const template = await QueryTemplateModel.getById(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // 템플릿 소유자만 공유 가능
      if (template.userId !== currentUser.uid) {
        throw new Error('You do not have permission to share this template');
      }

      // 이미 공유되어 있는지 확인
      const existingShare = await this.getByTemplateAndEmail(templateId, email);
      if (existingShare) {
        // 기존 공유 업데이트
        const shareRef = doc(db, COLLECTION_NAME, existingShare.id);
        await setDoc(shareRef, {
          permission,
          message,
          updatedAt: serverTimestamp(),
        }, { merge: true });

        return existingShare.id;
      }

      // 공유 ID 생성 (templateId_email 형식으로 고유성 보장)
      const shareId = `${templateId}_${email.replace(/[.@]/g, '_')}`;
      
      // 공유 데이터 준비
      const shareData: FirestoreQueryTemplateShare = {
        id: shareId,
        templateId,
        ownerId: currentUser.uid,
        sharedWith: email,
        permission,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        message,
        isAccepted: false, // 초기에는 미수락 상태
      };

      // Firestore에 저장
      const shareRef = doc(db, COLLECTION_NAME, shareId);
      await setDoc(shareRef, shareData);

      return shareId;
    } catch (error) {
      console.error('Error sharing template:', error);
      throw error;
    }
  }

  /**
   * 공유 해제
   * @param templateId 템플릿 ID
   * @param email 공유 대상 사용자 이메일
   */
  static async remove(templateId: string, email: string): Promise<void> {
    try {
      // 현재 사용자 확인
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // 공유 정보 조회
      const share = await this.getByTemplateAndEmail(templateId, email);
      if (!share) {
        throw new Error('Share not found');
      }

      // 템플릿 소유자만 공유 해제 가능
      if (share.ownerId !== currentUser.uid) {
        throw new Error('You do not have permission to remove this share');
      }

      // Firestore에서 삭제
      const shareRef = doc(db, COLLECTION_NAME, share.id);
      await deleteDoc(shareRef);

      // 템플릿 모델에서도 공유 사용자 제거
      await QueryTemplateModel.shareTemplate(templateId, email, false);
    } catch (error) {
      console.error('Error removing template share:', error);
      throw error;
    }
  }

  /**
   * 템플릿 ID와 이메일로 공유 정보 조회
   * @param templateId 템플릿 ID
   * @param email 공유 대상 사용자 이메일
   * @returns 공유 정보 또는 null
   */
  static async getByTemplateAndEmail(
    templateId: string, 
    email: string
  ): Promise<FirestoreQueryTemplateShare | null> {
    try {
      // 공유 ID 생성 (templateId_email 형식)
      const shareId = `${templateId}_${email.replace(/[.@]/g, '_')}`;
      
      // Firestore에서 조회
      const shareRef = doc(db, COLLECTION_NAME, shareId);
      const shareSnap = await getDoc(shareRef);

      if (!shareSnap.exists()) {
        return null;
      }

      return shareSnap.data() as FirestoreQueryTemplateShare;
    } catch (error) {
      console.error('Error getting template share:', error);
      throw error;
    }
  }

  /**
   * 템플릿 ID로 모든 공유 정보 조회
   * @param templateId 템플릿 ID
   * @returns 공유 정보 목록
   */
  static async getByTemplateId(templateId: string): Promise<FirestoreQueryTemplateShare[]> {
    try {
      // 현재 사용자 확인
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // 템플릿 존재 확인 및 접근 권한 검증
      const template = await QueryTemplateModel.getById(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // 템플릿 소유자만 모든 공유 정보 조회 가능
      if (template.userId !== currentUser.uid) {
        throw new Error('You do not have permission to view shares for this template');
      }

      // 쿼리 생성
      const sharesQuery = query(
        collection(db, COLLECTION_NAME),
        where('templateId', '==', templateId),
        orderBy('createdAt', 'desc')
      );

      // 쿼리 실행
      const sharesSnap = await getDocs(sharesQuery);
      const shares: FirestoreQueryTemplateShare[] = [];

      // 결과 매핑
      sharesSnap.forEach((doc) => {
        const shareData = doc.data() as FirestoreQueryTemplateShare;
        shares.push(shareData);
      });

      return shares;
    } catch (error) {
      console.error('Error getting template shares:', error);
      throw error;
    }
  }

  /**
   * 이메일로 공유받은 모든 템플릿 공유 정보 조회
   * @param email 공유 대상 사용자 이메일
   * @returns 공유 정보 목록
   */
  static async getBySharedEmail(email: string): Promise<FirestoreQueryTemplateShare[]> {
    try {
      // 쿼리 생성
      const sharesQuery = query(
        collection(db, COLLECTION_NAME),
        where('sharedWith', '==', email),
        orderBy('createdAt', 'desc')
      );

      // 쿼리 실행
      const sharesSnap = await getDocs(sharesQuery);
      const shares: FirestoreQueryTemplateShare[] = [];

      // 결과 매핑
      sharesSnap.forEach((doc) => {
        const shareData = doc.data() as FirestoreQueryTemplateShare;
        shares.push(shareData);
      });

      return shares;
    } catch (error) {
      console.error('Error getting shared templates:', error);
      throw error;
    }
  }

  /**
   * 공유 수락/거부
   * @param shareId 공유 ID
   * @param accept 수락 여부
   */
  static async respondToShare(shareId: string, accept: boolean): Promise<void> {
    try {
      // 현재 사용자 확인
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) {
        throw new Error('User not authenticated or email not available');
      }

      // 공유 정보 조회
      const shareRef = doc(db, COLLECTION_NAME, shareId);
      const shareSnap = await getDoc(shareRef);

      if (!shareSnap.exists()) {
        throw new Error('Share not found');
      }

      const shareData = shareSnap.data() as FirestoreQueryTemplateShare;

      // 공유 대상이 현재 사용자인지 확인
      if (shareData.sharedWith !== currentUser.email) {
        throw new Error('This share is not for you');
      }

      // 이미 응답한 경우
      if (shareData.isAccepted && accept) {
        throw new Error('This share is already accepted');
      }

      // Firestore 업데이트
      await setDoc(shareRef, {
        isAccepted: accept,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // 거부한 경우, 공유 삭제
      if (!accept) {
        await deleteDoc(shareRef);
      }
    } catch (error) {
      console.error('Error responding to share:', error);
      throw error;
    }
  }

  /**
   * 권한 업데이트
   * @param shareId 공유 ID
   * @param permission 새 권한
   */
  static async updatePermission(shareId: string, permission: SharePermission): Promise<void> {
    try {
      // 현재 사용자 확인
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // 공유 정보 조회
      const shareRef = doc(db, COLLECTION_NAME, shareId);
      const shareSnap = await getDoc(shareRef);

      if (!shareSnap.exists()) {
        throw new Error('Share not found');
      }

      const shareData = shareSnap.data() as FirestoreQueryTemplateShare;

      // 템플릿 소유자만 권한 업데이트 가능
      if (shareData.ownerId !== currentUser.uid) {
        throw new Error('You do not have permission to update this share');
      }

      // Firestore 업데이트
      await setDoc(shareRef, {
        permission,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      console.error('Error updating share permission:', error);
      throw error;
    }
  }

  /**
   * 공유 링크 생성
   * @param templateId 템플릿 ID
   * @param expiryDays 만료일 (기본 7일)
   * @returns 공유 링크 URL
   */
  static async createShareLink(templateId: string, expiryDays: number = 7): Promise<string> {
    try {
      // 현재 사용자 확인
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // 템플릿 존재 확인 및 접근 권한 검증
      const template = await QueryTemplateModel.getById(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // 템플릿 소유자만 링크 생성 가능
      if (template.userId !== currentUser.uid) {
        throw new Error('You do not have permission to create share link for this template');
      }

      // 만료일 계산
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryDays);

      // 링크 ID 생성
      const linkId = uuidv4();
      
      // 링크 데이터 준비 (공유 링크는 별도 컬렉션에 저장할 수 있음)
      // 실제 구현에서는 링크 전용 컬렉션을 생성하거나 보안 규칙을 조정해야 함
      const linkData = {
        id: linkId,
        templateId,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        expiryDate: Timestamp.fromDate(expiryDate),
        isActive: true,
      };

      // 여기서는 실제 링크 생성 기능은 구현하지 않고 컨셉만 제공
      // 실제 구현에서는 Firebase Hosting이나 Functions를 사용하여 공유 링크 시스템 구축 필요

      // 예시 URL 형식
      const shareUrl = `${window.location.origin}/templates/shared/${linkId}`;
      
      return shareUrl;
    } catch (error) {
      console.error('Error creating share link:', error);
      throw error;
    }
  }

  /**
   * 사용자의 공유 상태 요약 조회
   * @returns 공유 상태 요약
   */
  static async getSharingSummary(): Promise<{
    sharedByMe: number;
    sharedWithMe: number;
    pendingShareRequests: number;
  }> {
    try {
      // 현재 사용자 확인
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) {
        throw new Error('User not authenticated or email not available');
      }

      // 내가 공유한 템플릿 조회
      const sharedByMeQuery = query(
        collection(db, COLLECTION_NAME),
        where('ownerId', '==', currentUser.uid)
      );
      const sharedByMeSnap = await getDocs(sharedByMeQuery);
      
      // 나에게 공유된 템플릿 조회
      const sharedWithMeQuery = query(
        collection(db, COLLECTION_NAME),
        where('sharedWith', '==', currentUser.email),
        where('isAccepted', '==', true)
      );
      const sharedWithMeSnap = await getDocs(sharedWithMeQuery);
      
      // 대기 중인 공유 요청 조회
      const pendingSharesQuery = query(
        collection(db, COLLECTION_NAME),
        where('sharedWith', '==', currentUser.email),
        where('isAccepted', '==', false)
      );
      const pendingSharesSnap = await getDocs(pendingSharesQuery);

      return {
        sharedByMe: sharedByMeSnap.size,
        sharedWithMe: sharedWithMeSnap.size,
        pendingShareRequests: pendingSharesSnap.size,
      };
    } catch (error) {
      console.error('Error getting sharing summary:', error);
      throw error;
    }
  }
}

// 기본 내보내기
export default QueryTemplateShareModel;