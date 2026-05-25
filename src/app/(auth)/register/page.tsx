"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Upload, X, CheckCircle, Check } from "lucide-react";
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
import {
  IMAGE_ACCEPT_ATTR,
  normalizeImageFile,
  validateImageFile,
} from "@/lib/image-upload";

const RESEND_COOLDOWN_SEC = 60;

export default function RegisterPage() {
  // 이메일 인증 관련 state
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [ticket, setTicket] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [verifying, setVerifying] = useState(false);

  // 회원가입 폼 state
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState<
    "email" | "code" | "password" | "confirm" | "image" | "general" | ""
  >("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const handleFileSelect = useCallback(async (rawFile: File) => {
    setProcessing(true);
    try {
      const normalized = await normalizeImageFile(rawFile);
      if ("error" in normalized) {
        setError(normalized.error);
        setErrorField("image");
        return;
      }

      const check = validateImageFile(normalized.file);
      if (!check.ok) {
        setError(check.error);
        setErrorField("image");
        return;
      }

      setImageFile(normalized.file);
      setImagePreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(normalized.file);
      });
      setError("");
      setErrorField("");
    } finally {
      setProcessing(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) void handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const removeImage = useCallback(() => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  }, [imagePreview]);

  async function handleSendCode() {
    setError("");
    setErrorField("");

    if (!email) {
      setError("이메일을 입력해주세요.");
      setErrorField("email");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("올바른 이메일 형식을 입력해주세요.");
      setErrorField("email");
      return;
    }

    setVerifying(true);
    try {
      const res = await fetch("/api/auth/email-verify/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.status === 409) {
        setError("이미 가입된 이메일입니다.");
        setErrorField("email");
        return;
      }
      if (res.status === 429) {
        const data = (await res.json()) as { retryAfter?: number };
        setError(`잠시 후 다시 시도해주세요. (${data.retryAfter ?? 60}초 후)`);
        setErrorField("email");
        return;
      }
      if (!res.ok) {
        setError("코드 전송에 실패했습니다. 잠시 후 다시 시도해주세요.");
        setErrorField("email");
        return;
      }
      setCodeSent(true);
      setCode("");
      setResendIn(RESEND_COOLDOWN_SEC);
    } catch {
      setError("요청에 실패했습니다.");
      setErrorField("email");
    } finally {
      setVerifying(false);
    }
  }

  async function handleVerifyCode() {
    setError("");
    setErrorField("");
    if (!/^\d{6}$/.test(code)) {
      setError("6자리 코드를 입력해주세요.");
      setErrorField("code");
      return;
    }

    setVerifying(true);
    try {
      const res = await fetch("/api/auth/email-verify/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        ticket?: string;
        code?: string;
      };
      if (data.ok && data.ticket) {
        setTicket(data.ticket);
        setVerified(true);
      } else if (data.code === "EXPIRED") {
        setError("코드가 만료되었습니다. 다시 받아주세요.");
        setErrorField("code");
        setCodeSent(false);
        setCode("");
      } else if (data.code === "MAX_ATTEMPTS") {
        setError("코드가 무효화되었습니다. 처음부터 다시 시도해주세요.");
        setErrorField("code");
        setCodeSent(false);
        setCode("");
      } else {
        setError("코드가 일치하지 않습니다. 다시 확인해주세요.");
        setErrorField("code");
      }
    } catch {
      setError("요청에 실패했습니다.");
      setErrorField("code");
    } finally {
      setVerifying(false);
    }
  }

  function handleEmailChange(value: string) {
    setEmail(value);
    setError("");
    setErrorField("");
    // 이메일이 바뀌면 인증 상태 초기화
    if (verified || codeSent) {
      setVerified(false);
      setCodeSent(false);
      setCode("");
      setTicket("");
      setResendIn(0);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setErrorField("");

    if (!verified || !ticket) {
      setError("이메일 인증을 먼저 완료해주세요.");
      setErrorField("email");
      return;
    }
    if (!password) {
      setError("비밀번호를 입력해주세요.");
      setErrorField("password");
      return;
    }
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      setErrorField("password");
      return;
    }
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      setErrorField("confirm");
      return;
    }
    if (!imageFile) {
      setError("인증 이미지를 업로드해주세요.");
      setErrorField("image");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("ticket", ticket);
    formData.append("password", password);
    formData.append("verificationImage", imageFile);

    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get("utm_source") ?? "";
    if (utmSource) formData.append("utmSource", utmSource);
    if (typeof document !== "undefined" && document.referrer) {
      formData.append("referer", document.referrer);
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json();
      const msg = data.error || "회원가입에 실패했습니다.";
      setError(msg);
      // 이메일 관련 에러면 인증 초기화 (만료 등)
      if (msg.includes("이메일 인증")) {
        setVerified(false);
        setCodeSent(false);
        setCode("");
        setTicket("");
        setErrorField("email");
      } else if (msg.includes("이메일")) {
        setErrorField("email");
      } else {
        setErrorField("general");
      }
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="size-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            가입 완료
          </CardTitle>
          <CardDescription>
            회원가입이 완료되었습니다.
            <br />
            관리자 승인 후 로그인할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardFooter className="pt-4">
          <Button nativeButton={false} render={<Link href="/login" />} className="w-full">
            로그인 페이지로
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight">
          GORDON
        </CardTitle>
        <CardDescription>새 계정을 만드세요</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-4 pb-6">
          {errorField === "general" && error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
          <div className="space-y-1">
            <Label htmlFor="name">이름</Label>
            <p className="text-xs text-muted-foreground">
              네프콘 닉네임과 동일하게 입력해주세요.
            </p>
            <Input
              id="name"
              type="text"
              placeholder="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* 이메일 + 인증 */}
          <div className="space-y-1">
            <Label htmlFor="email">이메일</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                className={`flex-1 ${errorField === "email" ? "border-destructive" : ""}`}
                disabled={verified}
                required
              />
              {!verified && !codeSent && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSendCode}
                  disabled={verifying || !email}
                  className="shrink-0"
                >
                  {verifying ? "전송 중..." : "코드 전송"}
                </Button>
              )}
            </div>
            {errorField === "email" && (
              <p className="text-xs text-destructive">{error}</p>
            )}

            {codeSent && !verified && (
              <div className="space-y-1 pt-2">
                <div className="flex gap-2">
                  <Input
                    id="email-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="6자리 인증 코드"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                      setError("");
                      setErrorField("");
                    }}
                    className={`flex-1 ${errorField === "code" ? "border-destructive" : ""}`}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleVerifyCode}
                    disabled={verifying || code.length !== 6}
                    className="shrink-0"
                  >
                    {verifying ? "확인 중..." : "인증 확인"}
                  </Button>
                </div>
                {errorField === "code" && (
                  <p className="text-xs text-destructive">{error}</p>
                )}
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
                  disabled={resendIn > 0 || verifying}
                  onClick={handleSendCode}
                >
                  {resendIn > 0
                    ? `코드 재전송 (${String(resendIn).padStart(2, "0")}초)`
                    : "코드 재전송"}
                </button>
              </div>
            )}

            {verified && (
              <p className="flex items-center gap-1.5 pt-1 text-sm font-medium text-green-600 dark:text-green-500">
                <Check className="size-4" />
                인증 완료
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              placeholder="6자 이상"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
                setErrorField("");
              }}
              className={errorField === "password" ? "border-destructive" : ""}
              required
            />
            {errorField === "password" && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="confirmPassword">비밀번호 확인</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError("");
                setErrorField("");
              }}
              className={errorField === "confirm" ? "border-destructive" : ""}
              required
            />
            {errorField === "confirm" && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label>인증 이미지 *</Label>
            <p className="text-xs text-muted-foreground">
              네프콘 닉네임과 혜택 기간(결제 종료일)이 함께 보이는 사진을 업로드해주세요.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={IMAGE_ACCEPT_ATTR}
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFileSelect(f);
                e.target.value = "";
              }}
            />
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="인증 이미지 미리보기"
                  className="h-32 w-full rounded-md border object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute right-1 top-1 rounded-full bg-background/80 p-1 hover:bg-background"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`flex h-32 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed transition-colors ${
                  dragOver
                    ? "border-primary bg-primary/5"
                    : errorField === "image"
                      ? "border-destructive"
                      : "border-muted-foreground/25 hover:border-primary/50"
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mb-2 size-6 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  {processing ? "이미지 처리 중..." : "클릭 또는 드래그하여 업로드"}
                </p>
                <p className="text-xs text-muted-foreground/60">
                  JPG, PNG, WEBP (최대 5MB)
                </p>
              </div>
            )}
            {errorField === "image" && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-4">
          <Button
            type="submit"
            className="w-full"
            disabled={loading || !verified}
          >
            {loading ? "가입 중..." : !verified ? "이메일 인증 후 가입 가능" : "회원가입"}
          </Button>
          <p className="text-sm text-muted-foreground">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="text-primary hover:underline">
              로그인
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
