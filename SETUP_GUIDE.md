# Morning Glow - Routine Coach

모닝 루틴을 추적하고 침대 정리 상태를 AI(Gemini)로 분석하는 웹 앱입니다.

## 프로젝트 구조

```
morning-glow---routine-coach/
├── src/
│   ├── App.tsx                 # 메인 앱 (상태 관리, 뷰 렌더)
│   ├── components/             # UI 컴포넌트
│   ├── services/
│   │   └── geminiService.ts    # 서버 API 호출 (보안: 클라이언트 래퍼)
│   └── types.ts                # 타입 정의
├── server/
│   ├── index.js                # Express 서버 (Gemini API 호출, 핵심 로직)
│   ├── package.json            # 서버 의존성
│   ├── .env.example            # 환경변수 예시
│   └── .env                    # 실제 API 키 (로컬만, git 무시됨)
├── vite.config.ts             # Vite 설정 (프록시 포함)
└── package.json               # 클라이언트 의존성
```

## 보안 개선 사항

### 이전 상태 (위험)
- `@google/genai` SDK가 클라이언트 번들에 포함됨
- API 키가 `.env.local`로 클라이언트 코드에 노출될 수 있음

### 현재 상태 (안전)
- `services/geminiService.ts`: 클라이언트는 `/api/analyze`만 호출 (단순 fetch)
- `server/index.js`: Express 서버에서 Gemini API 호출 (API 키는 서버만 알고 있음)
- API 키는 서버의 `server/.env`에 안전하게 관리

## 로컬 개발 환경 설정

### 1. Gemini API 키 발급
1. https://ai.google.dev 방문
2. "Get API Key" 클릭하여 Google 로그인
3. API 키 복사

### 2. 서버 설정

프로젝트 루트에서:
```bash
cd server
npm install
```

`server/.env` 파일 생성 (`.env.example` 참고):
```
GEMINI_API_KEY=YOUR_ACTUAL_API_KEY_HERE
PORT=3001
```

### 3. 클라이언트 설정 (필요시)

프로젝트 루트에서:
```bash
npm install
```

`.env.local` 파일은 더 이상 필요 없습니다 (API 키는 서버에서 관리됨).

## 실행 방법

### 터미널 1: 서버 시작 (포트 3001)
```bash
cd server
npm start
```

출력 예:
```
✅ Server listening on http://localhost:3001
   POST /api/analyze - Bed image analysis endpoint
   GET /health - Health check
```

### 터미널 2: 클라이언트 개발 서버 (포트 3000)
```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 열기.

## 동작 흐름

1. 사용자가 침대 사진 업로드
2. 클라이언트: 이미지(base64)를 `/api/analyze` POST 요청
3. Vite 프록시: `http://localhost:3001/api/analyze`로 전달
4. 서버: `@google/genai`로 Gemini 모델 호출
5. 서버: 점수와 피드백(JSON) 반환
6. 클라이언트: 결과 표시 및 로컬스토리지 저장

## 환경변수

### 클라이언트 (.env.local - 선택사항)
```
# 현재는 서버에서 모든 GenAI 작업을 처리하므로 필요 없음
```

### 서버 (server/.env - 필수)
```
GEMINI_API_KEY=your_api_key_here
PORT=3001  # 선택사항 (기본값: 3001)
```

## 문제 해결

### "Cannot find module '@google/genai'"
- 서버 폴더에서 `npm install` 실행했는지 확인
- `server/package.json`이 존재하는지 확인

### "GEMINI_API_KEY not set"
- `server/.env` 파일 생성했는지 확인
- API 키를 올바르게 붙여넣었는지 확인 (공백 제거)

### "Cannot POST /api/analyze"
- 서버가 포트 3001에서 실행 중인지 확인 (`npm start`)
- `vite.config.ts`의 프록시 설정 확인

### CORS 에러
- 로컬 개발에서는 Vite 프록시 설정이 자동으로 처리함
- 프로덕션/배포 시에만 CORS 설정 추가 필요

## 빌드 및 배포

### 클라이언트 빌드
```bash
npm run build
```

`dist/` 폴더에 빌드 결과 생성.

### 서버 배포 옵션

#### Option 1: Vercel (추천)
`vercel.json` 추가:
```json
{
  "buildCommand": "npm install && npm run build",
  "outputDirectory": "dist",
  "env": {
    "GEMINI_API_KEY": "@gemini_api_key"
  }
}
```

#### Option 2: 전통적 Node 호스팅
- `server/` 폴더를 별도로 배포
- 환경변수 설정: `GEMINI_API_KEY`

## 기술 스택

### 클라이언트
- React 19
- TypeScript
- Vite
- Tailwind CSS
- Lucide React (아이콘)

### 서버
- Node.js / Express
- @google/genai (Gemini API SDK)
- dotenv (환경변수 관리)

## 라이선스

MIT
