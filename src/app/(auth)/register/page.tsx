"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Upload, X, CheckCircle } from "lucide-react";
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

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState<
    "email" | "password" | "confirm" | "image" | "general" | ""
  >("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = useCallback((file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("JPG, PNG, WEBP 형식의 이미지만 허용됩니다.");
      setErrorField("image");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("이미지 크기는 5MB 이하여야 합니다.");
      setErrorField("image");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
    setErrorField("");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const removeImage = useCallback(() => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  }, [imagePreview]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
    formData.append("email", email);
    formData.append("password", password);
    formData.append("verificationImage", imageFile);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json();
      const msg = data.error || "회원가입에 실패했습니다.";
      setError(msg);
      setErrorField(msg.includes("이메일") ? "email" : "general");
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
          <div className="space-y-1">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
                setErrorField("");
              }}
              className={errorField === "email" ? "border-destructive" : ""}
              required
            />
            {errorField === "email" && (
              <p className="text-xs text-destructive">{error}</p>
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
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = ALLOWED_TYPES.join(",");
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) handleFileSelect(file);
                  };
                  input.click();
                }}
              >
                <Upload className="mb-2 size-6 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  클릭 또는 드래그하여 업로드
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
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "가입 중..." : "회원가입"}
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
