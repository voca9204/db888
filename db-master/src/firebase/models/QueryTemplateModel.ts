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
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db, auth } from '../config';
import { QueryTemplate, QueryTemplateParameter } from '../../types/store';
import { v4 as uuidv4 } from 'uuid';

// 컬렉션 이름
const COLLECTION_NAME = 'queryTemplates';

/**
 * Firestore에 저장된 쿼리 템플릿의 형태
 */
export interface FirestoreQueryTemplate {
  id: string;
  name: string;
  description?: string;
  sql: string;
  parameters?: QueryTemplateParameter[];
  tags?: string[];
  isPublic: boolean;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // 접근 권한 있는 사용자 ID 목록 (이메일)
  sharedWith?: string[];
  // 쿼리 상태 (QueryState) 저장
  queryState?: any;
  // 버전 정보
  version?: number;
  // 원본 템플릿 ID (복제된 경우)
  sourceTemplateId?: string;
}

/**
 * 쿼리 템플릿 모델 클래스
 */
export class QueryTemplateModel {
  /**
   * 새 쿼리 템플릿 생성
   * @param template 템플릿 데이터
   * @returns 생성된 템플릿의 ID
   */
  static async create(template: Omit<QueryTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // 현재 사용자 확인
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // ID 생성
      const templateId = uuidv4();
      
      // 템플릿 데이터 준비
      const templateData: FirestoreQueryTemplate = {
        id: templateId,
        name: template.name,
        description: template.description || '',
        sql: template.sql,
        parameters: template.parameters || [],
        tags: template.tags || [],
        isPublic: template.isPublic,
        userId: currentUser.uid,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        queryState: template.queryState || null,
        version: 1,
      };

      // Firestore에 저장
      const templateRef = doc(db, COLLECTION_NAME, templateId);
      await setDoc(templateRef, templateData);

      return templateId;
    } catch (error) {
      console.error('Error creating query template:', error);
      throw error;
    }
  }

  /**
   * 템플릿 ID로 쿼리 템플릿 조회
   * @param id 템플릿 ID
   * @returns 템플릿 데이터 또는 null
   */
  static async getById(id: string): Promise<QueryTemplate | null> {
    try {
      const templateRef = doc(db, COLLECTION_NAME, id);
      const templateSnap = await getDoc(templateRef);

      if (!templateSnap.exists()) {
        return null;
      }

      const templateData = templateSnap.data() as FirestoreQueryTemplate;
      return this.convertToQueryTemplate(templateData);
    } catch (error) {
      console.error('Error getting query template:', error);
      throw error;
    }
  }

  /**
   * 템플릿 업데이트
   * @param id 템플릿 ID
   * @param template 업데이트할 데이터
   */
  static async update(id: string, template: Partial<QueryTemplate>): Promise<void> {
    try {
      // 현재 사용자 확인
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // 템플릿 존재 확인 및 접근 권한 검증
      const existingTemplate = await this.getById(id);
      if (!existingTemplate) {
        throw new Error('Template not found');
      }

      // 템플릿 소유자 또는 공유 사용자만 수정 가능
      if (existingTemplate.userId !== currentUser.uid && 
          !(existingTemplate as any).sharedWith?.includes(currentUser.email)) {
        throw new Error('You do not have permission to update this template');
      }

      // 업데이트 데이터 준비
      const updateData: Partial<FirestoreQueryTemplate> = {
        ...template,
        updatedAt: serverTimestamp() as Timestamp,
        version: (existingTemplate as any).version ? (existingTemplate as any).version + 1 : 1,
      };

      // id, createdAt, userId는 업데이트하지 않음
      delete updateData.id;
      delete updateData.createdAt;
      delete updateData.userId;

      // Firestore 업데이트
      const templateRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(templateRef, updateData);
    } catch (error) {
      console.error('Error updating query template:', error);
      throw error;
    }
  }

  /**
   * 템플릿 삭제
   * @param id 템플릿 ID
   */
  static async delete(id: string): Promise<void> {
    try {
      // 현재 사용자 확인
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // 템플릿 존재 확인 및 접근 권한 검증
      const existingTemplate = await this.getById(id);
      if (!existingTemplate) {
        throw new Error('Template not found');
      }

      // 템플릿 소유자만 삭제 가능
      if (existingTemplate.userId !== currentUser.uid) {
        throw new Error('You do not have permission to delete this template');
      }

      // Firestore에서 삭제
      const templateRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(templateRef);
    } catch (error) {
      console.error('Error deleting query template:', error);
      throw error;
    }
  }

  /**
   * 사용자의 템플릿 목록 조회
   * @param userId 사용자 ID (옵션, 기본값: 현재 사용자)
   * @param includeShared 공유받은 템플릿 포함 여부
   * @param tag 태그로 필터링 (옵션)
   * @param searchTerm 검색어 (옵션)
   * @returns 템플릿 목록
   */
  static async listForUser(
    userId?: string,
    includeShared: boolean = true,
    tag?: string,
    searchTerm?: string
  ): Promise<QueryTemplate[]> {
    try {
      // 현재 사용자 확인
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // 조회할 사용자 ID 결정
      const targetUserId = userId || currentUser.uid;
      const queryFilters = [];

      // 기본 필터: 사용자 ID
      queryFilters.push(where('userId', '==', targetUserId));

      // 태그 필터 (옵션)
      if (tag) {
        queryFilters.push(where('tags', 'array-contains', tag));
      }

      // 쿼리 생성
      const templatesQuery = query(
        collection(db, COLLECTION_NAME),
        ...queryFilters,
        orderBy('updatedAt', 'desc')
      );

      // 쿼리 실행
      const templatesSnap = await getDocs(templatesQuery);
      const templates: QueryTemplate[] = [];

      // 결과 매핑
      templatesSnap.forEach((doc) => {
        const templateData = doc.data() as FirestoreQueryTemplate;
        templates.push(this.convertToQueryTemplate(templateData));
      });

      // 공유받은 템플릿 포함 옵션
      if (includeShared && currentUser.email) {
        const sharedQuery = query(
          collection(db, COLLECTION_NAME),
          where('sharedWith', 'array-contains', currentUser.email),
          orderBy('updatedAt', 'desc')
        );

        const sharedSnap = await getDocs(sharedQuery);
        sharedSnap.forEach((doc) => {
          const templateData = doc.data() as FirestoreQueryTemplate;
          templates.push(this.convertToQueryTemplate(templateData));
        });
      }

      // 검색어 필터 (옵션, 클라이언트 사이드에서 필터링)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return templates.filter(
          (template) =>
            template.name.toLowerCase().includes(searchLower) ||
            (template.description && template.description.toLowerCase().includes(searchLower)) ||
            template.sql.toLowerCase().includes(searchLower) ||
            template.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
        );
      }

      return templates;
    } catch (error) {
      console.error('Error listing query templates:', error);
      throw error;
    }
  }

  /**
   * 공개 템플릿 목록 조회
   * @param limit 최대 템플릿 수 (옵션, 기본값: 20)
   * @param tag 태그로 필터링 (옵션)
   * @returns 템플릿 목록
   */
  static async listPublicTemplates(maxLimit: number = 20, tag?: string): Promise<QueryTemplate[]> {
    try {
      // 필터 준비
      const queryFilters = [where('isPublic', '==', true)];

      // 태그 필터 (옵션)
      if (tag) {
        queryFilters.push(where('tags', 'array-contains', tag));
      }

      // 쿼리 생성
      const templatesQuery = query(
        collection(db, COLLECTION_NAME),
        ...queryFilters,
        orderBy('updatedAt', 'desc'),
        limit(maxLimit)
      );

      // 쿼리 실행
      const templatesSnap = await getDocs(templatesQuery);
      const templates: QueryTemplate[] = [];

      // 결과 매핑
      templatesSnap.forEach((doc) => {
        const templateData = doc.data() as FirestoreQueryTemplate;
        templates.push(this.convertToQueryTemplate(templateData));
      });

      return templates;
    } catch (error) {
      console.error('Error listing public query templates:', error);
      throw error;
    }
  }

  /**
   * 템플릿 공유 (사용자 추가/제거)
   * @param id 템플릿 ID
   * @param email 공유 대상 사용자 이메일
   * @param add 추가/제거 여부 (true: 추가, false: 제거)
   */
  static async shareTemplate(id: string, email: string, add: boolean = true): Promise<void> {
    try {
      // 현재 사용자 확인
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // 템플릿 존재 확인 및 접근 권한 검증
      const templateRef = doc(db, COLLECTION_NAME, id);
      const templateSnap = await getDoc(templateRef);

      if (!templateSnap.exists()) {
        throw new Error('Template not found');
      }

      const templateData = templateSnap.data() as FirestoreQueryTemplate;

      // 템플릿 소유자만 공유 가능
      if (templateData.userId !== currentUser.uid) {
        throw new Error('You do not have permission to share this template');
      }

      // 공유 목록 업데이트
      const sharedWith = templateData.sharedWith || [];
      const emailIndex = sharedWith.indexOf(email);

      if (add && emailIndex === -1) {
        // 사용자 추가
        sharedWith.push(email);
      } else if (!add && emailIndex !== -1) {
        // 사용자 제거
        sharedWith.splice(emailIndex, 1);
      } else {
        // 변경 없음
        return;
      }

      // Firestore 업데이트
      await updateDoc(templateRef, {
        sharedWith,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error sharing query template:', error);
      throw error;
    }
  }

  /**
   * 템플릿 복제
   * @param id 템플릿 ID
   * @param newName 새 템플릿 이름 (옵션)
   * @returns 새 템플릿 ID
   */
  static async cloneTemplate(id: string, newName?: string): Promise<string> {
    try {
      // 현재 사용자 확인
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // 원본 템플릿 조회
      const original = await this.getById(id);
      if (!original) {
        throw new Error('Template not found');
      }

      // 공개 템플릿이거나, 소유자이거나, 공유받은 템플릿만 복제 가능
      if (!original.isPublic && 
          original.userId !== currentUser.uid && 
          !(original as any).sharedWith?.includes(currentUser.email)) {
        throw new Error('You do not have permission to clone this template');
      }

      // 새 템플릿 생성
      const newTemplate: Omit<QueryTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
        name: newName || `${original.name} (Copy)`,
        description: original.description,
        sql: original.sql,
        parameters: original.parameters,
        tags: original.tags,
        isPublic: false, // 복제된 템플릿은 기본적으로 비공개
        userId: currentUser.uid,
        queryState: original.queryState,
      };

      // 소스 템플릿 ID 추가
      (newTemplate as any).sourceTemplateId = id;

      // 새 템플릿 저장
      return await this.create(newTemplate);
    } catch (error) {
      console.error('Error cloning query template:', error);
      throw error;
    }
  }

  /**
   * 태그 목록 조회
   * @param userId 사용자 ID (옵션, 기본값: 현재 사용자)
   * @returns 태그 목록
   */
  static async getTags(userId?: string): Promise<string[]> {
    try {
      // 현재 사용자 확인
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // 조회할 사용자 ID 결정
      const targetUserId = userId || currentUser.uid;

      // 사용자의 템플릿 조회
      const templates = await this.listForUser(targetUserId, true);

      // 태그 추출 및 중복 제거
      const tags = new Set<string>();
      templates.forEach((template) => {
        template.tags?.forEach((tag) => {
          tags.add(tag);
        });
      });

      return Array.from(tags).sort();
    } catch (error) {
      console.error('Error getting tags:', error);
      throw error;
    }
  }

  /**
   * FirestoreQueryTemplate를 QueryTemplate로 변환
   * @param data Firestore 데이터
   * @returns QueryTemplate 객체
   */
  static convertToQueryTemplate(data: FirestoreQueryTemplate): QueryTemplate {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      sql: data.sql,
      parameters: data.parameters || [],
      tags: data.tags || [],
      isPublic: data.isPublic,
      userId: data.userId,
      createdAt: data.createdAt?.toMillis() || Date.now(),
      updatedAt: data.updatedAt?.toMillis() || Date.now(),
      queryState: data.queryState,
      // 추가 필드
      sharedWith: data.sharedWith,
      version: data.version,
      sourceTemplateId: data.sourceTemplateId,
    };
  }
}

// 기본 내보내기
export default QueryTemplateModel;
