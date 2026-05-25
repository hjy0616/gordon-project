"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const RESEND_COOLDOWN_SEC = 60;

export function PasswordChangeCard({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [ticket, setTicket] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [redirectAfter, setRedirectAfter] = useState(false);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  useEffect(() => {
    if (!redirectAfter) return;
    const t = setTimeout(() => signOut({ callbackUrl: "/login" }), 1500);
    return () => clearTimeout(t);
  }, [redirectAfter]);

  function reset() {
    setCodeSent(false);
    setVerified(false);
    setTicket("");
    setCode("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setInfo("");
    setResendIn(0);
    setRedirectAfter(false);
  }

  function handleOpen() {
    reset();
    setOpen(true);
  }

  async function handleSendCode() {
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const res = await fetch("/api/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.status === 429) {
        const data = (await res.json()) as { retryAfter?: number };
        setError(`잠시 후 다시 시도해주세요. (${data.retryAfter ?? 60}초 후)`);
      } else {
        setCodeSent(true);
        setCode("");
        setInfo(`${email} 으로 코드를 보냈습니다. 10분 이내에 입력해주세요.`);
        setResendIn(RESEND_COOLDOWN_SEC);
      }
    } catch {
      setError("요청에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode() {
    setError("");
    if (!/^\d{6}$/.test(code)) {
      setError("6자리 코드를 입력해주세요.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/password-reset/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        ticket?: string;
        code?: string;
      };
      if (data.ok && data.ticket) {
        setTicket(data.ticket);
        setVerified(true);
        setInfo("");
      } else if (data.code === "EXPIRED") {
        setError("코드가 만료되었습니다. 다시 받아주세요.");
        setCodeSent(false);
        setCode("");
      } else if (data.code === "MAX_ATTEMPTS") {
        setError("코드가 무효화되었습니다. 처음부터 다시 시도해주세요.");
        setCodeSent(false);
        setCode("");
      } else {
        setError("코드가 일치하지 않습니다. 다시 확인해주세요.");
      }
    } catch {
      setError("요청에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!verified) {
      setError("먼저 인증을 완료해주세요.");
      return;
    }
    if (newPassword.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket, newPassword }),
      });
      const data = (await res.json()) as { ok: boolean; code?: string };
      if (!data.ok) {
        if (data.code === "TICKET_EXPIRED" || data.code === "CODE_CONSUMED") {
          setError("세션이 만료되었습니다. 코드를 다시 전송해주세요.");
          setVerified(false);
          setCodeSent(false);
          setTicket("");
          setCode("");
        } else if (data.code === "WEAK_PASSWORD") {
          setError("비밀번호는 6자 이상이어야 합니다.");
        } else {
          setError("비밀번호 변경에 실패했습니다.");
        }
        return;
      }
      setInfo("비밀번호가 변경되었습니다. 다시 로그인해주세요.");
      setRedirectAfter(true);
    } catch {
      setError("요청에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>비밀번호 변경</CardTitle>
          <CardDescription>
            보안을 위해 등록된 이메일로 6자리 코드를 받아 본인 확인 후 새 비밀번호를 설정합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" onClick={handleOpen}>
            비밀번호 변경 시작
          </Button>
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) reset();
        }}
      >
        <DialogContent className="max-h-[80svh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>비밀번호 변경</DialogTitle>
            <DialogDescription>
              {info ||
                `${email} 로 6자리 인증 코드를 받아 본인 확인 후 새 비밀번호를 설정합니다.`}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmPassword} className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}

            {/* 1단계: 코드 전송 → 인증 확인 */}
            <div className="space-y-2">
              <Label htmlFor="acc-code">인증 코드</Label>
              <div className="flex gap-2">
                <Input
                  id="acc-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="6자리 코드"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setError("");
                  }}
                  disabled={verified || loading}
                  className="flex-1"
                />
                {!codeSent && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleSendCode}
                    disabled={loading}
                  >
                    {loading ? "전송 중..." : "코드 전송"}
                  </Button>
                )}
                {codeSent && !verified && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleVerifyCode}
                    disabled={loading || code.length !== 6}
                  >
                    {loading ? "확인 중..." : "인증 확인"}
                  </Button>
                )}
              </div>

              {codeSent && !verified && (
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
                  disabled={resendIn > 0 || loading}
                  onClick={handleSendCode}
                >
                  {resendIn > 0
                    ? `코드 재전송 (${String(resendIn).padStart(2, "0")}초)`
                    : "코드 재전송"}
                </button>
              )}

              {verified && (
                <p className="flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-500">
                  <Check className="size-4" />
                  인증 완료
                </p>
              )}
            </div>

            {/* 2단계: 새 비밀번호 (인증 완료 후 활성화) */}
            <div className="space-y-2">
              <Label htmlFor="acc-new">새 비밀번호</Label>
              <Input
                id="acc-new"
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError("");
                }}
                disabled={!verified || loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-confirm">비밀번호 확인</Label>
              <Input
                id="acc-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError("");
                }}
                disabled={!verified || loading}
              />
              {verified && (
                <p className="text-xs text-muted-foreground">6자 이상 입력해주세요.</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="submit"
                disabled={
                  !verified ||
                  loading ||
                  newPassword.length < 6 ||
                  newPassword !== confirmPassword
                }
                className="w-full"
              >
                {loading ? "처리 중..." : "비밀번호 변경"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
