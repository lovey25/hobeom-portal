# 성장 기록 관리

자녀의 키·몸무게 측정 기록을 Google Spreadsheet 와 양방향으로 동기화하고, 한국 표준 성장도표 백분위(3% / 50% / 97%) 위에 실제 측정 곡선을 겹쳐 보여주는 대시보드 앱입니다.

## 데이터 저장소

- **단일 진실 공급원(SoT) = Google Sheets**. 본 앱은 CSV 데이터 레이어(`src/lib/data.ts`)를 사용하지 않고 [src/lib/sheets/growthAdapter.ts](../../../lib/sheets/growthAdapter.ts) 를 통해 시트를 직접 읽고 씁니다.
- 기존 다른 대시보드 앱들의 CSV 패턴과는 의도적으로 분리되어 있습니다.

### 시트 탭 구조

| 탭 이름 | 컬럼 |
|--------|------|
| `설정` | `아이이름`, `생년월일`, `성별`, `관리자이메일`, `생성일` (1행만 사용) |
| `기록` | `측정일`, `키(cm)`, `몸무게(kg)`, `나이(개월수)`, `기록자`, `메모`, `등록일시` |

컬럼 순서는 자유롭게 바꿔도 됩니다. 어댑터가 1행 헤더를 읽어 동적으로 매핑합니다. 다만 **헤더 문자열은 위와 정확히 일치**해야 합니다.

`나이(개월수)`는 비어 있으면 어댑터가 생년월일에서 자동 계산해 채워 넣습니다.

## UI 구성

- **헤더 카드**: 자녀 이름·성별·현재 나이·생일. 디자인 시스템 stat 톤(`bg-pink-50` + `border-pink-200` + `text-pink-900`).
- **액션 버튼**: `+ 기록하기` (활성), `🤖 AI 자문받기` / `⚙️ 설정` (비활성, 후속 작업).
- **성장 그래프**: recharts `ComposedChart`. 좌(키 cm) / 우(몸무게 kg) 듀얼 Y축, X축은 0~144개월. 백분위 3~97% 구간은 옅은 Area 밴드, 50% 평균은 점선, 실측은 굵은 실선 + 점. 측정 기록의 개월 수에는 백분위 값을 선형 보간해서 채워 영역이 끊기지 않게 처리.
- **최근 기록 테이블**: 기본 접힘. 카드 헤더의 `펼치기 ▼` 클릭 시 펼쳐짐. 행 클릭 = 수정/삭제 모달.

## 환경 설정

`.env.local` 에 다음을 추가합니다.

```bash
GOOGLE_SHEETS_ID=<스프레드시트 URL의 /d/{ID}/edit 부분>
GOOGLE_SERVICE_ACCOUNT_KEY=<service account JSON 전체를 한 줄로>
```

`GOOGLE_SERVICE_ACCOUNT_KEY` 안의 `private_key` 의 `\n` 은 그대로 두면 됩니다 — 어댑터가 실행 시점에 실제 개행으로 변환합니다.

### Service Account 발급 절차

1. [Google Cloud Console](https://console.cloud.google.com/) → 프로젝트 선택 → **API 및 서비스 → 라이브러리** → "Google Sheets API" 사용 설정
2. **사용자 인증 정보 → 서비스 계정 만들기** → 이름 입력 → 역할 미부여 → 완료
3. 생성된 서비스 계정 클릭 → **키 → 키 추가 → JSON** 다운로드
4. 대상 스프레드시트를 service account 이메일(`xxx@xxx.iam.gserviceaccount.com`)에 **편집자** 권한으로 공유
5. 다운로드한 JSON 전체를 한 줄로 만들어 위 환경변수에 저장

## 접근 권한

`apps.csv` 의 `id=19` 로 등록되어 있고, 권한은 `data/user-app-settings.csv` 로 사용자별 부여합니다.

- 기본 정책상 `apps.csv` 에 등록된 앱은 모든 사용자에게 보이지만, 본 앱은 `user-app-settings` 에 명시적 `is_visible=false` 행을 넣어 일반 사용자에게 숨겨두었습니다.
- **신규 사용자가 가입하면 [src/lib/data.ts](../../../lib/data.ts) 의 `initializeUserAppSettings` 가 모든 앱을 자동으로 `is_visible=true` 로 등록**합니다. 따라서 신규 가입자는 즉시 노출됩니다. 이를 원치 않으면 가입 직후 관리자가 `is_visible=false` 로 바꿔야 합니다.
- 사용자에게 노출하려면 관리자가 [data/user-app-settings.csv](../../../../data/user-app-settings.csv) 에서 해당 사용자 + `app_id=19` 행을 `is_visible=true` 로 변경하거나, CSV 편집기 화면에서 직접 수정합니다.

## 백분위 데이터

[src/lib/sheets/percentile-data.ts](../../../lib/sheets/percentile-data.ts) 의 정적 상수입니다. 한국 소아청소년 2017 표준 성장도표 기반의 시각화 근사값이며 **의학 진단 용도가 아닙니다**. 0~144개월(0~12세) 구간만 다룹니다.

## API 엔드포인트

| 메서드   | 경로                                  | 설명                          |
| -------- | ------------------------------------- | ----------------------------- |
| `GET`    | `/api/growth-records/profile`         | 자녀 프로필 조회 (`설정` 탭)  |
| `GET`    | `/api/growth-records`                 | 측정 기록 목록 조회           |
| `POST`   | `/api/growth-records`                 | 측정 기록 추가                |
| `PUT`    | `/api/growth-records/[rowIndex]`      | 행 번호 기준 측정 기록 수정   |
| `DELETE` | `/api/growth-records/[rowIndex]`      | 행 번호 기준 측정 기록 삭제   |

`rowIndex` 는 Google Sheets 의 1-based 행 번호이며, 헤더가 1행이므로 데이터는 2부터 시작합니다.

## 주요 한계

- Google Sheets API 는 분당 60회 read / 100MB / project 단위 한도가 있습니다. 가족 단위 사용에서는 부담이 없지만, 한 페이지 진입 시 `profile` + `records` 두 번 호출이 발생합니다.
- 본 앱은 **자녀 1명** 모델입니다. 자녀를 늘리려면 Sheets 구조와 어댑터를 함께 손봐야 합니다.
- AI 자문·설정 버튼은 현재 비활성 자리만 잡혀 있고 기능은 후속 작업입니다.
- 측정 기록 시간(`등록일시`)은 KST(UTC+9) 기준 문자열로 기록됩니다.
