import { getAppsByCategory } from "@/lib/data";
import { AppIconGrid } from "@/components/AppIconGrid";
import { LoginForm } from "@/components/LoginForm";

export default async function Home() {
  const publicApps = await getAppsByCategory("public");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">호범 포털</h1>
            <div className="text-sm text-gray-500">포괄적인 웹 포털 서비스</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Side - Public Apps */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">🌐 누구나 사용 가능한 앱</h2>
              <p className="text-gray-600 mb-6">로그인 없이도 이용할 수 있는 유용한 도구들입니다.</p>
              <AppIconGrid apps={publicApps} columns={2} />
            </div>

            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">💡 더 많은 기능을 원하신다면?</h3>
              <p className="text-blue-700 text-sm">
                로그인하시면 개인화된 대시보드와 고급 도구들을 이용하실 수 있습니다.
              </p>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex items-start justify-center">
            <LoginForm />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>&copy; 2025 호범 포털. 모든 권리 보유.</p>
            <p className="mt-2">Next.js 15 + TypeScript로 구축된 현대적 웹 포털</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
