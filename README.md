# 풍선 상품 재고 관리 시스템

풍선 도매 사이트들의 상품 정보를 자동으로 수집하여 Excel 파일로 관리하는 웹 애플리케이션입니다.

## 주요 기능

- **다중 사이트 크롤링**: 새로이벤트, 조이파티 B2B, 조이파티 일반 사이트 지원
- **카테고리별 관리**: 고무풍선, 은박풍선 등 2단계 카테고리 구조
- **자동 로그인**: 새로이벤트 B2B 사이트 자동 로그인 처리
- **중복 제거**: 수량 정보가 포함된 중복 상품 자동 필터링
- **Excel 내보내기**: 카테고리별 시트 분리된 Excel 파일 생성
- **실시간 미리보기**: 크롤링 전 상품 미리보기 기능

## 기술 스택

- **Frontend**: Next.js 15.5, React 19, TypeScript, Tailwind CSS v4
- **Backend**: Next.js App Router API Routes
- **크롤링**: Puppeteer (headless browser automation)
- **데이터 처리**: XLSX (Excel 파일 생성)
- **패키지 매니저**: Yarn

## Getting Started

### 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가합니다.

```env
SAEROEVENT_USERNAME=your_username
SAEROEVENT_PASSWORD=your_password
```

### 개발 서버 실행

```bash
# 의존성 설치
yarn install

# 개발 서버 실행
yarn dev
```

[http://localhost:3000](http://localhost:3000)에 접속하여 애플리케이션을 사용할 수 있습니다.

### 빌드 및 실행

```bash
# 프로덕션 빌드
yarn build

# 프로덕션 서버 실행
yarn start
```

## 사용 방법

1. **사이트 선택**: 크롤링할 도매 사이트 선택 (새로이벤트, 조이파티 B2B, 조이파티 일반)
2. **크롤링 모드 선택**:
   - 전체 카테고리: 모든 카테고리 상품 크롤링
   - 선택 카테고리: 특정 카테고리만 선택하여 크롤링
3. **미리보기**: 크롤링 전 상품 목록 미리보기
4. **Excel 다운로드**: 카테고리별로 정리된 Excel 파일 다운로드

## 프로젝트 구조

```
balloon-stock/
├── app/
│   ├── api/
│   │   └── scrape/         # 크롤링 API 엔드포인트
│   ├── page.tsx            # 메인 페이지 UI
│   └── layout.tsx          # 루트 레이아웃
├── lib/
│   └── scraper.ts          # 크롤링 로직 및 데이터 처리
├── public/                 # 정적 파일
└── .env.local             # 환경 변수 (git 제외)
```

## 지원 사이트

### 1. 새로이벤트 (B2B)

- URL: https://www.saeroeventb2b.co.kr:10497
- 특징: 로그인 필요, 22개 세부 카테고리
- 카테고리: 고무풍선 7개, 은박풍선 15개

### 2. 조이파티 B2B

- URL: https://www.joypartyb2b.co.kr
- 특징: 24개 세부 카테고리
- 카테고리: 고무풍선 11개, 은박풍선 13개

### 3. 조이파티 일반

- URL: https://www.joyparty.co.kr
- 특징: 7개 기본 카테고리
- 카테고리: 고무풍선, 은박풍선, 풍선세트 등

## 주요 기능 상세

### 중복 상품 필터링

- 수량 정보 패턴 자동 감지: (100입), (1/10/250), (50입/봉,10봉/1박스) 등
- 기본 상품명과 수량 포함 상품명 구분
- 동일 상품의 다양한 포장 단위 통합 관리

### Excel 출력 형식

- 각 카테고리별 독립 시트
- 상품 정보: 번호, 상품명
- 파일명: `[사이트명]_products_[카테고리정보]_[타임스탬프].xlsx`
