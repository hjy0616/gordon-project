import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileCheck,
  UserCheck,
  ArrowRight,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const [total, pending, active, expired, suspended, renewal, recentUsers] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "PENDING" } }),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({ where: { status: "EXPIRED" } }),
      prisma.user.count({ where: { status: "SUSPENDED" } }),
      prisma.user.count({ where: { renewalImage: { not: null } } }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

  const stats = [
    { label: "전체 사용자", value: total, icon: Users, color: "text-foreground" },
    { label: "승인 대기", value: pending, icon: Clock, color: "text-yellow-500" },
    { label: "활성", value: active, icon: CheckCircle, color: "text-green-500" },
    { label: "만료", value: expired, icon: AlertTriangle, color: "text-orange-500" },
    { label: "정지", value: suspended, icon: XCircle, color: "text-destructive" },
  ];

  const statusLabels: Record<string, string> = {
    PENDING: "대기",
    ACTIVE: "활성",
    EXPIRED: "만료",
    SUSPENDED: "정지",
  };

  const statusColors: Record<string, string> = {
    PENDING: "text-yellow-500",
    ACTIVE: "text-green-500",
    EXPIRED: "text-orange-500",
    SUSPENDED: "text-destructive",
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
              <s.icon className={`size-4 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alert Cards */}
      {pending > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="size-4 text-yellow-500" />
              승인 대기 중인 사용자가 {pending}명 있습니다
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button nativeButton={false} render={<Link href="/admin/approvals" />} variant="outline" size="sm">
              승인 처리하기
            </Button>
          </CardContent>
        </Card>
      )}

      {renewal > 0 && (
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileCheck className="size-4 text-blue-500" />
              재인증 요청이 {renewal}건 있습니다
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button nativeButton={false} render={<Link href="/admin/renewals" />} variant="outline" size="sm">
              재인증 처리하기
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="group cursor-pointer transition-colors hover:border-primary/50">
          <Link href="/admin/approvals" className="block p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserCheck className="size-5 text-yellow-500" />
                <div>
                  <p className="font-medium">승인 대기</p>
                  <p className="text-sm text-muted-foreground">{pending}명 대기 중</p>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </Card>

        <Card className="group cursor-pointer transition-colors hover:border-primary/50">
          <Link href="/admin/renewals" className="block p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileCheck className="size-5 text-blue-500" />
                <div>
                  <p className="font-medium">재인증</p>
                  <p className="text-sm text-muted-foreground">{renewal}건 요청</p>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </Card>

        <Card className="group cursor-pointer transition-colors hover:border-primary/50">
          <Link href="/admin/users" className="block p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="size-5 text-foreground" />
                <div>
                  <p className="font-medium">사용자 관리</p>
                  <p className="text-sm text-muted-foreground">전체 {total}명</p>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </Card>
      </div>

      {/* Recent Users */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">최근 가입자</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentUsers.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between text-sm"
              >
                <div>
                  <span className="font-medium">{u.name || "이름 없음"}</span>
                  <span className="ml-2 text-muted-foreground">{u.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs ${statusColors[u.status]}`}>
                    {statusLabels[u.status]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {u.createdAt.toLocaleDateString("ko-KR")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
