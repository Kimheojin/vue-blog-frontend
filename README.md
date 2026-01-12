# Vue 블로그 프론트엔드

- CSR 구조 블로그 프론트엔드 코드 

## 주요 기능

### 보안 및 인증 아키텍처

**HttpOnly Cookie** 기반의 인증 시스템 구축

- **JWT 전략**: 클라이언트 사이드 스크립트에서 토큰 접근이 불가능하도록 설정.
- **자동 인증 관리**: Axios의 `withCredentials: true` 설정을 통해 브라우저가 쿠키를 안전하게 관리하고 모든 API 요청에 자동으로 포함하도록 구성
- 프론트엔드 코드 내에서 인증 정보를 직접 다루지 않음

### 마크다운 렌더링 엔진 및 코드 시각화 구현 (Marked + Highlight.js)

- **렌더링 파이프라인**: 깃허브(GFM) 표준 마크다운 ↔ HTML 실시간 변환 로직 구축
- **가독성 및 시각화 최적화**:
    - `Highlight.js`를 통한 코드 블록 자동 언어 감지 및 Syntax Highlighting 적용.
    - `github-markdown-css` 기반의 다크 모드 최적화 테마 적용.

### 공통 에러 처리

일관된 사용자 피드백을 위해 에러 처리 메커니즘을 표준화

- **HttpError 클래스**: 백엔드(Spring)의 `ErrorResponse` 규격에 맞춰 네트워크 에러를 표준화된 형식으로 래핑
- **검증 오류 자동 파싱**: 서버 측 유효성 검사 실패 내역을 자동으로 해석하여 UI에 즉각 반영하는 로직을 구현
- **UI 통합**: 비즈니스 로직과 UI 피드백을 연결

## 구현 기능

### 일반 사용자 기능

- **게시글 조회**: 카테고리, 태그별 조회 및 전체 글 보기.
- **댓글 기능**: 댓글 조회, 작성 및 대댓글 작성. 작성자는 비밀번호 확인을 통해 자신의 댓글 삭제 가능.
- **검색**: 전용 검색 기능을 통한 콘텐츠 찾기.
- **소개 페이지**: 작성자 프로필 페이지.

### 관리자 기능

- **대시보드 및 인증**: 보안 로그인 및 관리자 전용 영역.
- **콘텐츠 관리**: 게시글에 대한 CRUD (작성, 조회, 수정, 삭제) 기능.
- **카테고리 및 태그 관리**: 콘텐츠 정리 기능.
- **댓글 관리**: 모든 댓글 조회 및 부적절한 콘텐츠 삭제(관리자 권한).
- **미디어 관리**: 이미지 업로드, 조회 및 삭제.
- **SEO 및 동기화**: 검색 및 SEO 인덱스 생성 동기화 도구

## 기술 스택

- **Core**: Vue 3 (Composition API), TypeScript, Vite
- **UI**: Element Plus
- **Architecture**: TSyringe (Dependency Injection)
- **Network**: Axios
- **Content**: Marked, Highlight.js

## 프로젝트 아키텍처

```
src/
├── components/   # UI 컴포넌트
├── composables/  # Vue 컴포저블
├── entity/       # 데이터 모델 및 DTO (요청/응답/데이터)
├── http/         # Axios 설정 및 에러 처리
├── repository/   # 데이터 접근 계층 (API 호출)
├── router/       # Vue Router 설정
├── service/      # 비즈니스 로직 계층 (TSyringe 사용)
└── views/        # 페이지 뷰 (관리자 및 일반 사용자)
```

**아키텍처 특징:**

- **의존성 주입**
    - Service와 Repository는 `TSyringe`를 통해 관리
- **타입화된 엔티티**
    - API 응답은 `class-transformer`를 사용하여 자동으로 TypeScript 클래스 인스턴스로 변환


## 프로젝트 도식도

![프로젝트 도식도](docs/BlogDIagram.png)

## 관련 링크

- **Backend Repository**: [spring-blog-backend](https://github.com/Kimheojin/spring-blog-backend.git)

