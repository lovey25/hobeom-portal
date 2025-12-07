#!/bin/bash

set -e

echo "🚀 호범 포털 초기화 중..."
echo ""

# 데이터 디렉토리 확인
if [ ! -d "data" ]; then
    echo "❌ data 디렉토리를 찾을 수 없습니다."
    exit 1
fi

# CSV 파일 초기화
echo "📊 CSV 데이터 파일 초기화 중..."
echo ""

for sample_file in data/*.sample.csv; do
    if [ -f "$sample_file" ]; then
        filename=$(basename "$sample_file" .sample.csv)
        target_file="data/${filename}.csv"
        
        if [ ! -f "$target_file" ]; then
            cp "$sample_file" "$target_file"
            echo "  ✅ ${filename}.csv 생성"
        else
            echo "  📝 ${filename}.csv 이미 존재 (건너뛰기)"
        fi
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 초기화 완료"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 실행 명령어:"
echo "  개발 (포트 3000):  npm run dev"
echo "  운영 (포트 3002):  npm run build && npm run start"
echo ""
echo "🔐 테스트 계정:"
echo "  - 관리자: admin / password"
echo "  - 사용자: user1 / password"
echo "  - 데모: demo / password"
echo ""
echo "💡 참고: data/*.csv는 Git에 커밋되지 않습니다"
echo "📚 자세한 내용: docs/environment-setup.md"
echo ""
