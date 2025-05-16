# DB Master

DB Master는 MariaDB 데이터베이스를 쉽게 관리하고 쿼리할 수 있는 웹 기반 도구입니다.

## 기능

- 데이터베이스 연결 관리
- 스키마 시각화
- 테이블 데이터 브라우저
- 쿼리 빌더
- 쿼리 템플릿 저장 및 공유
- ERD 시각화
- 데이터 시각화

## 개발 환경 설정

### 요구 사항

- Node.js 18+
- npm 9+
- Firebase 계정

### 설치 및 실행

1. 저장소 복제
   ```bash
   git clone https://github.com/yourusername/db-master.git
   cd db-master
   ```

2. 종속성 설치
   ```bash
   # 메인 애플리케이션 종속성
   cd db-master
   npm install

   # Firebase Functions 종속성
   cd ../functions
   npm install
   ```

3. 개발 모드로 실행
   ```bash
   # 메인 애플리케이션 디렉토리에서
   cd ../db-master
   npm run dev
   ```

4. Firebase 에뮬레이터 실행 (별도 터미널에서)
   ```bash
   # 프로젝트 루트 디렉토리에서
   firebase emulators:start
   ```

## 배포

### 환경

- **Development**: 로컬 개발 환경
- **Staging**: 테스트 및 QA 환경
- **Production**: 라이브 사용자 환경

### 배포 프로세스

1. **자동 배포**
   - `develop` 브랜치에 푸시 -> 스테이징 환경에 자동 배포
   - `main` 브랜치에 푸시 -> 프로덕션 환경에 자동 배포 (승인 후)

2. **수동 배포**
   ```bash
   # 스테이징 환경에 배포
   npm run build:staging
   firebase deploy --only hosting:staging,functions -P default

   # 프로덕션 환경에 배포
   npm run build:prod
   firebase deploy --only hosting:production,functions -P default
   ```

3. **롤백**
   ```bash
   # 프로덕션 환경을 특정 버전으로 롤백
   node scripts/deployment/rollback.js <version> production
   ```

## 환경 구성

- `.env.development`: 개발 환경 설정
- `.env.staging`: 스테이징 환경 설정
- `.env.production`: 프로덕션 환경 설정

## CI/CD

GitHub Actions를 사용하여 CI/CD 파이프라인이 구축되어 있습니다:

- `ci.yml`: 모든 PR 및 브랜치 푸시에 대한 린트 및 테스트
- `deploy-staging.yml`: 스테이징 환경 자동 배포
- `deploy-production.yml`: 프로덕션 환경 배포 (승인 필요)

## 성능 모니터링 및 에러 추적

Firebase Performance Monitoring 및 Analytics를 사용하여 성능과 에러를 추적합니다:

- 성능 지표 수집 및 분석
- 에러 추적 및 보고
- 사용자 행동 분석

## 프로젝트 구조

```
/db-master            # 메인 애플리케이션 코드
  /src
    /assets           # 정적 자산 파일
    /components       # React 컴포넌트
    /context          # React Context
    /firebase         # Firebase 설정 및 유틸리티
    /hooks            # React 훅
    /pages            # 애플리케이션 페이지
    /router           # 라우팅 설정
    /services         # 서비스 API
    /store            # 상태 관리
    /types            # TypeScript 타입 정의
    /utils            # 유틸리티 함수

/functions            # Firebase Cloud Functions
  /src                # 함수 소스 코드

/.github/workflows    # GitHub Actions CI/CD 구성
/scripts              # 유틸리티 스크립트
```

## 기여 방법

1. 저장소 포크
2. 기능 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경 사항 커밋 (`git commit -m 'Add amazing feature'`)
4. 브랜치 푸시 (`git push origin feature/amazing-feature`)
5. Pull Request 열기

## 라이선스

[MIT](LICENSE)
