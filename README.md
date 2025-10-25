# Diablo4 Weekly Notion (Pro)
- 주요 커뮤니티( Maxroll / D4builds / Icy Veins / Reddit / 인벤 )의 최신 빌드 **링크**를 수집하고,
- OpenAI API로 **요약 텍스트**를 생성해,
- Notion DB에 **가득 찬 주간 리포트 페이지**를 만듭니다.

## Secrets (GitHub → Settings → Secrets → Actions)
- `NOTION_TOKEN` — Notion Internal Integration token
- `NOTION_DATABASE_ID` — Target database id (share the integration with the DB)
- `OPENAI_API_KEY` — OpenAI API key

## 실행
- Actions → **Diablo4 Weekly Notion (Pro)** → Run workflow
- 매주 금요일 09:00 KST 자동 실행

## 제한
- 각 사이트가 차단하면 링크 수집만 수행될 수 있습니다.
- Notion API 한 번 호출당 100블록 제한 → 95블록만 전송.
