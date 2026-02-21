"use client";

import { useState } from "react";
import { SearchForm, type StudentResult } from "@/components/search-form";
import { ResultCard } from "@/components/result-card";
import { AlertCircle, ShieldCheck, BookOpenCheck } from "lucide-react";

export default function HomePage() {
  const [results, setResults] = useState<StudentResult[]>([]);
  const [error, setError] = useState("");

  function handleResults(data: StudentResult[]) {
    setResults(data);
    setError("");
  }

  function handleError(msg: string) {
    setError(msg);
    setResults([]);
  }

  function handleClear() {
    setError("");
    setResults([]);
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <BookOpenCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight text-balance">
              Hệ Thống Tra Cứu Học Phí
            </h1>
            <p className="text-sm text-muted-foreground">
              Tra cứu nhanh, chính xác, bảo mật
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
        <SearchForm
          onResults={handleResults}
          onError={handleError}
          onClear={handleClear}
        />

        {/* Error message */}
        {error && (
          <div
            className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4"
            role="alert"
          >
            <AlertCircle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
            <p className="text-sm text-destructive font-medium">{error}</p>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Tìm thấy{" "}
              <span className="font-semibold text-foreground">
                {results.length}
              </span>{" "}
              kết quả
            </p>
            {results.map((result, i) => (
              <ResultCard key={`${result.hoTen}-${result.lop}-${i}`} result={result} index={i} />
            ))}
          </div>
        )}

        {/* Security notice */}
        <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
          <ShieldCheck className="h-5 w-5 shrink-0 text-primary mt-0.5" />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground">
              Thông tin được bảo mật
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Số điện thoại được ẩn một phần khi hiển thị. Hệ thống có giới hạn
              số lần tra cứu để đảm bảo an toàn dữ liệu. Mọi truy vấn đều
              được xử lý trên máy chủ bảo mật.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-auto">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <p className="text-xs text-center text-muted-foreground">
            Được tạo bởi <a href="https://tracuuhp.vercel.app/" target="_blank" className="text-blue-600 hover:text-blue-800 underline">Hệ thống tra cứu HP</a> năm 2026
          </p>
        </div>
      </footer>
    </main>
  );
}
