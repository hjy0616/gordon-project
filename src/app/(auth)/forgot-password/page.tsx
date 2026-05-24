"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Step = "email" | "code" | "newPassword" | "done";

const RESEND_COOLDOWN_SEC = 60;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [ticket, setTicket] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  async function handleRequestCode(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.status === 429) {
        const data = (await res.json()) as { retryAfter?: number };
        setError(`잠시 후 다시 시도해주세요. (${data.retryAfter ?? 60}초 후)`);
      } else {
        setStep("code");
        setResendIn(RESEND_COOLDOWN_SEC);
      }
    } catch {
      setError("요청에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/password-reset/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = (await res.json()) as { ok: boolean; ticket?: string; code?: string };
      if (data.ok && data.ticket) {
        setTicket(data.ticket);
        setStep("newPassword");
      } else if (data.code === "EXPIRED") {
        setError("코드가 만료되었습니다. 다시 받아주세요.");
        setCode("");
        setStep("email");
      } else if (data.code === "MAX_ATTEMPTS") {
        setError("코드가 무효화되었습니다. 처음부터 다시 시도해주세요.");
        setCode("");
        setStep("email");
      } else {
        setError("코드가 일치하지 않습니다. 다시 확인해주세요.");
      }
    } catch {
      setError("요청에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
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
      if (data.ok) {
        setStep("done");
        setTimeout(() => router.push("/login"), 2000);
      } else if (data.code === "TICKET_EXPIRED" || data.code === "CODE_CONSUMED") {
        setError("세션이 만료되었습니다. 코드를 다시 입력해주세요.");
        setStep("code");
      } else if (data.code === "WEAK_PASSWORD") {
        setError("비밀번호는 6자 이상이어야 합니다.");
      } else {
        setError("비밀번호 변경에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
    } catch {
      setError("요청에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight">
          비밀번호 재설정
        </CardTitle>
        <CardDescription>
          {step === "email" && "가입하신 이메일을 입력해주세요."}
          {step === "code" && "이메일로 받은 6자리 코드를 입력해주세요."}
          {step === "newPassword" && "새 비밀번호를 설정해주세요."}
          {step === "done" && "비밀번호가 변경되었습니다."}
        </CardDescription>
      </CardHeader>

      {step === "email" && (
        <form onSubmit={handleRequestCode}>
          <CardContent className="space-y-4 pb-6">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 pt-4">
            <Button type="submit" className="w-full" disabled={loading || !email}>
              {loading ? "전송 중..." : "코드 받기"}
            </Button>
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← 로그인 화면으로 돌아가기
            </Link>
          </CardFooter>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={handleVerifyCode}>
          <CardContent className="space-y-4 pb-6">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-medium">{email}</span> 으로 6자리 코드를 보냈습니다. 10분 이내에 입력해주세요.
            </p>
            <CodeInput value={code} onChange={(v) => { setCode(v); setError(""); }} />
          </CardContent>
          <CardFooter className="flex flex-col gap-3 pt-4">
            <Button
              type="submit"
              className="w-full"
              disabled={loading || code.length !== 6}
            >
              {loading ? "확인 중..." : "확인"}
            </Button>
            <div className="flex w-full items-center justify-between text-sm">
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                disabled={resendIn > 0 || loading}
                onClick={() => handleRequestCode()}
              >
                {resendIn > 0
                  ? `코드 재발송 (${String(resendIn).padStart(2, "0")}초)`
                  : "코드 재발송"}
              </button>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => { setStep("email"); setCode(""); setError(""); }}
              >
                ← 이메일 다시 입력
              </button>
            </div>
          </CardFooter>
        </form>
      )}

      {step === "newPassword" && (
        <form onSubmit={handleConfirm}>
          <CardContent className="space-y-4 pb-6">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="space-y-2">
              <Label htmlFor="new-password">새 비밀번호</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">비밀번호 확인</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">6자 이상 입력해주세요.</p>
          </CardContent>
          <CardFooter className="pt-4">
            <Button
              type="submit"
              className="w-full"
              disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
            >
              {loading ? "변경 중..." : "비밀번호 변경"}
            </Button>
          </CardFooter>
        </form>
      )}

      {step === "done" && (
        <CardContent className="space-y-2 pb-6">
          <p className="text-sm">비밀번호가 변경되었습니다. 잠시 후 로그인 화면으로 이동합니다.</p>
        </CardContent>
      )}
    </Card>
  );
}

function CodeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(6, " ").split("").slice(0, 6);

  function setDigitAt(idx: number, d: string) {
    const cleaned = d.replace(/\D/g, "").slice(-1);
    const next = (value.padEnd(6, " ").slice(0, idx) + cleaned + value.padEnd(6, " ").slice(idx + 1))
      .replace(/\s/g, "")
      .slice(0, 6);
    onChange(next);
    if (cleaned && idx < 5) refs.current[idx + 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const t = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!t) return;
    e.preventDefault();
    onChange(t);
    refs.current[Math.min(t.length, 5)]?.focus();
  }

  return (
    <div className="flex justify-between gap-2">
      {digits.map((d, i) => (
        <Input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          className="aspect-square w-full text-center text-xl"
          value={d.trim()}
          onChange={(e) => setDigitAt(i, e.target.value)}
          onPaste={handlePaste}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !value[i] && i > 0) {
              refs.current[i - 1]?.focus();
            }
          }}
        />
      ))}
    </div>
  );
}
