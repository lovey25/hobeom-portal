#!/bin/bash

echo "🚀 호범 포털 개발 환경 초기화 중..."

# 데이터 디렉토리 확인
if [ ! -d "data" ]; then
    echo "❌ data 디렉토리를 찾을 수 없습니다."
    exit 1
fi

# 실제 CSV 파일이 없으면 샘플에서 복사
echo "📊 데이터 파일 초기화 중..."

if [ ! -f "data/users.csv" ]; then
    if [ -f "data/users.sample.csv" ]; then
        cp data/users.sample.csv data/users.csv
        echo "✅ users.csv 초기화 완료"
    else
        echo "❌ users.sample.csv 파일이 없습니다."
    fi
else
    echo "📝 users.csv 파일이 이미 존재합니다."
fi

if [ ! -f "data/apps.csv" ]; then
    if [ -f "data/apps.sample.csv" ]; then
        cp data/apps.sample.csv data/apps.csv
        echo "✅ apps.csv 초기화 완료"
    else
        echo "❌ apps.sample.csv 파일이 없습니다."
    fi
else
    echo "📝 apps.csv 파일이 이미 존재합니다."
fi

echo ""
echo "🎯 테스트 계정:"
echo "   - 관리자: admin / password"
echo "   - 사용자: user1 / password"
echo "   - 데모: demo / password"
echo ""
echo "⚠️  주의: data/*.csv 파일들은 Git에 포함되지 않습니다."
echo "   실제 운영환경에서는 별도 백업이 필요합니다."
echo ""
echo "✨ 개발 서버를 시작하려면: npm run dev"