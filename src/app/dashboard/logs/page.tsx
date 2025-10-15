import { redirect } from "next/navigation";

export default function LogsRedirectPage() {
  // 간단히 admin 로그 페이지로 리다이렉트
  redirect("/dashboard/admin/system-logs");
}
