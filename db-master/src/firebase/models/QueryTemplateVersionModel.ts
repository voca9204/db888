import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../config';
import { QueryTemplate } from '../../types/store';
import { FirestoreQueryTemplate, QueryTemplateModel } from './QueryTemplateModel';
import { v4 as uuidv4 } from 'uuid';

// 컬렉션 이름
const COLLECTION_NAME = 'queryTemplateVersions';

/**
 * Firestore에 저장된 쿼리 템플릿 버전 데이터 구조
 */
export interface FirestoreQueryTemplateVersion {
  id: string;
  templateId: string;
  version: number;
  name: string;
  description?: string;
  sql: string;
  parameters?: any[];
  tags?: string[];
  queryState?: any;
  createdAt: Timestamp;
  createdBy: string; // 버전 생성자 ID
}

/**
 * 쿼리 템플릿 버전 모델 클래스
 */
export class QueryTemplateVersionModel {
  /**
   * 새 버전 생성 - 템플릿의 현재 상태를 버전으로 저장
   * @param templateId 템플릿 ID
   * @returns 생성된 버전 ID
   */
  static async createVersion(templateId: string): Promise<string> {
    try {
      // 현재 사용자 확인
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // 템플릿 조회
      const template = await QueryTemplateModel.getById(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // 템플릿 소유자 또는 공유 사용자만 버전 생성 가능
      if (template.userId !== currentUser.uid && 
          !(template as any).sharedWith?.includes(currentUser.email)) {
        throw new Error('You do not have permission to create versions for this template');
      }

      // 버전 ID 생성
      const versionId = uuidv4();
      
      // 버전 데이터 준비
      const versionData: FirestoreQueryTemplateVersion = {
        id: versionId,
        templateId: templateId,
        version: (template as any).version || 1,
        name: template.name,
        description: template.description,
        sql: template.sql,
        parameters: template.parameters,
        tags: template.tags,
        queryState: template.queryState,
        createdAt: serverTimestamp() as Timestamp,
        createdBy: currentUser.uid,
      };

      // Firestore에 저장
      const versionRef = doc(db, COLLECTION_NAME, versionId);
      await setDoc(versionRef, versionData);

      return versionId;
    } catch (error) {
      console.error('Error creating template version:', error);
      throw error;
    }
  }

  /**
   * 템플릿 ID로 모든 버전 조회
   * @param templateId 템플릿 ID
   * @returns 버전 목록
   */
  static async getVersionsByTemplateId(templateId: string): Promise<FirestoreQueryTemplateVersion[]> {
    try {
      // 현재 사용자 확인
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // 템플릿 조회하여 접근 권한 확인
      const template = await QueryTemplateModel.getById(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // 템플릿 소유자, 공유 사용자, 또는 공개 템플릿만 버전 조회 가능
      if (!template.isPublic && 
          template.userId !== currentUser.uid && 
          !(template as any).sharedWith?.includes(currentUser.email)) {
        throw new Error('You do not have permission to view versions of this template');
      }

      // 버전 쿼리 생성
      const versionsQuery = query(
        collection(db, COLLECTION_NAME),
        where('templateId', '==', templateId),
        orderBy('version', 'desc')
      );

      // 쿼리 실행
      const versionsSnap = await getDocs(versionsQuery);
      const versions: FirestoreQueryTemplateVersion[] = [];

      // 결과 매핑
      versionsSnap.forEach((doc) => {
        const versionData = doc.data() as FirestoreQueryTemplateVersion;
        versions.push(versionData);
      });

      return versions;
    } catch (error) {
      console.error('Error getting template versions:', error);
      throw error;
    }
  }

  /**
   * 버전 ID로 특정 버전 조회
   * @param versionId 버전 ID
   * @returns 버전 데이터
   */
  static async getVersionById(versionId: string): Promise<FirestoreQueryTemplateVersion | null> {
    try {
      // 현재 사용자 확인
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // 버전 조회
      const versionRef = doc(db, COLLECTION_NAME, versionId);
      const versionSnap = await getDoc(versionRef);

      if (!versionSnap.exists()) {
        return null;
      }

      const versionData = versionSnap.data() as FirestoreQueryTemplateVersion;

      // 관련 템플릿 조회하여 접근 권한 확인
      const template = await QueryTemplateModel.getById(versionData.templateId);
      if (!template) {
        throw new Error('Related template not found');
      }

      // 템플릿 소유자, 공유 사용자, 또는 공개 템플릿만 버전 조회 가능
      if (!template.isPublic && 
          template.userId !== currentUser.uid && 
          !(template as any).sharedWith?.includes(currentUser.email)) {
        throw new Error('You do not have permission to view this version');
      }

      return versionData;
    } catch (error) {
      console.error('Error getting template version:', error);
      throw error;
    }
  }

  /**
   * 템플릿을 특정 버전으로 복원
   * @param versionId 복원할 버전 ID
   * @returns 복원된 템플릿
   */
  static async restoreVersion(versionId: string): Promise<QueryTemplate> {
    try {
      // 현재 사용자 확인
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // 버전 조회
      const version = await this.getVersionById(versionId);
      if (!version) {
        throw new Error('Version not found');
      }

      // 템플릿 조회
      const template = await QueryTemplateModel.getById(version.templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // 템플릿 소유자만 버전 복원 가능
      if (template.userId !== currentUser.uid) {
        throw new Error('You do not have permission to restore versions for this template');
      }

      // 버전 데이터로 템플릿 업데이트
      await QueryTemplateModel.update(version.templateId, {
        name: version.name,
        description: version.description,
        sql: version.sql,
        parameters: version.parameters,
        tags: version.tags,
        queryState: version.queryState,
      });

      // 업데이트된 템플릿 조회
      const updatedTemplate = await QueryTemplateModel.getById(version.templateId);
      if (!updatedTemplate) {
        throw new Error('Failed to retrieve updated template');
      }

      return updatedTemplate;
    } catch (error) {
      console.error('Error restoring template version:', error);
      throw error;
    }
  }

  /**
   * 버전에서 새 템플릿 생성
   * @param versionId 버전 ID
   * @param newName 새 템플릿 이름 (옵션)
   * @returns 새 템플릿 ID
   */
  static async createTemplateFromVersion(versionId: string, newName?: string): Promise<string> {
    try {
      // 현재 사용자 확인
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // 버전 조회
      const version = await this.getVersionById(versionId);
      if (!version) {
        throw new Error('Version not found');
      }

      // 원본 템플릿 조회
      const originalTemplate = await QueryTemplateModel.getById(version.templateId);
      if (!originalTemplate) {
        throw new Error('Original template not found');
      }

      // 공개 템플릿이거나, 소유자이거나, 공유받은 템플릿만 기능 사용 가능
      if (!originalTemplate.isPublic && 
          originalTemplate.userId !== currentUser.uid && 
          !(originalTemplate as any).sharedWith?.includes(currentUser.email)) {
        throw new Error('You do not have permission to use this version');
      }

      // 새 템플릿 생성
      const newTemplate: Omit<QueryTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
        name: newName || `${version.name} (Version ${version.version})`,
        description: version.description,
        sql: version.sql,
        parameters: version.parameters,
        tags: version.tags,
        isPublic: false, // 새 템플릿은 기본적으로 비공개
        userId: currentUser.uid,
        queryState: version.queryState,
      };

      // 소스 템플릿 및 버전 ID 추가
      (newTemplate as any).sourceTemplateId = version.templateId;
      (newTemplate as any).sourceVersionId = versionId;

      // 새 템플릿 저장
      return await QueryTemplateModel.create(newTemplate);
    } catch (error) {
      console.error('Error creating template from version:', error);
      throw error;
    }
  }
}

// 기본 내보내기
export default QueryTemplateVersionModel;