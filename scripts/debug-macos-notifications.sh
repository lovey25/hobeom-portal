#!/bin/bash

# macOS 알림 디버깅 스크립트

echo "============================================"
echo "macOS Edge 브라우저 알림 디버깅 가이드"
echo "============================================"
echo ""

echo "📋 체크리스트:"
echo ""

echo "1️⃣ macOS 시스템 알림 설정 확인"
echo "   → 시스템 환경설정 → 알림 및 집중 모드"
echo "   → Microsoft Edge 찾기"
echo "   → '알림 허용' 켜기"
echo ""

echo "2️⃣ 방해 금지 모드 확인"
echo "   → 제어 센터 (화면 오른쪽 상단)"
echo "   → '집중 모드' 또는 '방해 금지' 끄기"
echo ""

echo "3️⃣ Edge 브라우저 설정 확인"
echo "   → edge://settings/content/notifications"
echo "   → 사이트 권한 확인"
echo ""

echo "4️⃣ 알림 센터 확인"
echo "   → 화면 오른쪽 상단 클릭"
echo "   → 알림이 쌓여있는지 확인"
echo ""

echo "5️⃣ 터미널에서 알림 테스트 (선택사항)"
echo "   → osascript -e 'display notification \"테스트\" with title \"알림 테스트\"'"
echo ""

echo "============================================"
echo "💡 권장 해결 순서:"
echo "============================================"
echo "1. 시스템 환경설정에서 Edge 알림 허용"
echo "2. 방해 금지 모드 끄기"
echo "3. Edge 재시작"
echo "4. 테스트 알림 다시 전송"
echo ""
