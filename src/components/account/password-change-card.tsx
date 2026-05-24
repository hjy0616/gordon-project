"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
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

  async function requestCode() {
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
        setInfo(`${email} 으로 코드를 보냈습니다. 10분 이내에 입력해주세요.`);
        setResendIn(RESEND_COOLDOWN_SEC);
      }
    } catch {
      setError("요청에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setCode("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setInfo("");
    setResendIn(0);
    setRedirectAfter(false);
  }

  async function handleOpen() {
    reset();
    setOpen(true);
    await requestCode();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!/^\d{6}$/.test(code)) {
      setError("6자리 코드를 입력해주세요.");
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
      const v = await fetch("/api/password-reset/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const vData = (await v.json()) as { ok: boolean; ticket?: string; code?: string };
      if (!vData.ok || !vData.ticket) {
        if (vData.code === "EXPIRED") setError("코드가 만료되었습니다. 다시 받아주세요.");
        else if (vData.code === "MAX_ATTEMPTS")
          setError("코드가 무효화되었습니다. 처음부터 다시 시도해주세요.");
        else setError("코드가 일치하지 않습니다. 다시 확인해주세요.");
        return;
      }

      const c = await fetch("/api/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket: vData.ticket, newPassword }),
      });
      const cData = (await c.json()) as { ok: boolean; code?: string };
      if (!cData.ok) {
        if (cData.code === "TICKET_EXPIRED" || cData.code === "CODE_CONSUMED")
          setError("세션이 만료되었습니다. 코드를 다시 입력해주세요.");
        else if (cData.code === "WEAK_PASSWORD")
          setError("비밀번호는 6자 이상이어야 합니다.");
        else setError("비밀번호 변경에 실패했습니다.");
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
            보안을 위해 등록된 이메일로 6자리 코드를 보낸 뒤 새 비밀번호를 설정합니다.
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
              {info || `${email} 으로 6자리 코드를 보냈습니다.`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="space-y-2">
              <Label htmlFor="acc-code">인증 코드</Label>
              <Input
                id="acc-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="6자리 코드"
                value={code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
              />
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
                disabled={resendIn > 0 || loading}
                onClick={requestCode}
              >
                {resendIn > 0 ? `코드 재발송 (${String(resendIn).padStart(2, "0")}초)` : "코드 재발송"}
              </button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-new">새 비밀번호</Label>
              <Input
                id="acc-new"
                type="password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-confirm">비밀번호 확인</Label>
              <Input
                id="acc-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "처리 중..." : "변경 완료"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
