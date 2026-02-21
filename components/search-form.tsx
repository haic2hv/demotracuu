"use client";

import { useState } from "react";
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
import { Search, Loader2, GraduationCap } from "lucide-react";

export interface StudentResult {
  hoTen: string;
  lop: string;
  soDienThoai: string;
  soBuoi: string;
  soTien: string;
  ndck: string;
  ghiChu: string;
  trangThai: string;
  qrCode: string;
}

interface SearchFormProps {
  onResults: (results: StudentResult[]) => void;
  onError: (error: string) => void;
  onClear: () => void;
}

export function SearchForm({ onResults, onError, onClear }: SearchFormProps) {
  const [hoTen, setHoTen] = useState("");
  const [lop, setLop] = useState("");
  const [soDienThoai, setSoDienThoai] = useState("");
  const [loading, setLoading] = useState(false);

  function handlePhoneChange(value: string) {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 11);
    setSoDienThoai(digitsOnly);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onClear();

    if (!hoTen.trim() || !lop.trim() || !soDienThoai.trim()) {
      onError("Vui lòng nhập đầy đủ thông tin tra cứu.");
      return;
    }

    if (soDienThoai.length < 9) {
      onError("Số điện thoại phải có ít nhất 9 chữ số.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hoTen: hoTen.trim(),
          lop: lop.trim(),
          soDienThoai: soDienThoai.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        onError(data.error || "Đã có lỗi xảy ra.");
        return;
      }

      onResults(data.results);
    } catch {
      onError("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-border/60 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-xl text-foreground">
              Tra Cứu Học Phí
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Nhập thông tin để tra cứu học phí của học sinh
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="hoTen" className="text-foreground font-medium">
              Họ và tên học sinh
            </Label>
            <Input
              id="hoTen"
              placeholder="Ví dụ: Nguyễn Văn An"
              value={hoTen}
              onChange={(e) => setHoTen(e.target.value)}
              maxLength={100}
              required
              className="bg-background"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="lop" className="text-foreground font-medium">
              Lớp
            </Label>
            <Input
              id="lop"
              placeholder="Ví dụ: 6A1"
              value={lop}
              onChange={(e) => setLop(e.target.value)}
              maxLength={20}
              required
              className="bg-background"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="soDienThoai"
              className="text-foreground font-medium"
            >
              Số điện thoại phụ huynh
            </Label>
            <Input
              id="soDienThoai"
              type="tel"
              placeholder="Ví dụ: 0901234567"
              value={soDienThoai}
              onChange={(e) => handlePhoneChange(e.target.value)}
              maxLength={11}
              required
              inputMode="numeric"
              className="bg-background"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full mt-1">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang tra cứu...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Tra cứu
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
