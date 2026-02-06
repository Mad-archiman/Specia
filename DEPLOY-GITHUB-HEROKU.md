# GitHub ↔ Heroku 연동 시 Deploy Branch 후 404 해결

## 원인
- Heroku "Deploy Branch"는 **GitHub 저장소**의 해당 브랜치 코드를 가져와 배포합니다.
- 로컬에서만 수정하고 **GitHub에 푸시하지 않으면**, Heroku는 예전 코드를 배포합니다.
- 그래서 루트(`/`) 라우트가 없는 이전 버전이 배포되어 404가 발생합니다.

## 해결: 항상 GitHub에도 푸시하기

배포 흐름을 다음처럼 유지하세요.

### 1. 로컬에서 수정 후 커밋
```bash
git add .
git commit -m "설명 메시지"
```

### 2. GitHub에 푸시 (필수)
```bash
git push origin main
```
→ 이렇게 해야 Heroku가 가져오는 GitHub 저장소에 최신 코드가 반영됩니다.

### 3. Heroku 배포
- **방법 A (대시보드):** Heroku 앱 → Deploy 탭 → "Deploy Branch" 클릭
- **방법 B (CLI):** `git push heroku main`

GitHub 연동만 쓰는 경우에는 **반드시 2번(`git push origin main`)을 먼저** 한 뒤 Deploy Branch를 실행하세요.

## 요약
| 목적           | 명령어                 |
|----------------|------------------------|
| GitHub에 반영  | `git push origin main` |
| Heroku에 배포  | 대시보드 Deploy Branch 또는 `git push heroku main` |

GitHub에 최신 코드가 있어야 Deploy Branch 시 404가 나지 않습니다.
