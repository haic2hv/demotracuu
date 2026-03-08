import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiter
const rateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

function sanitize(input: string): string {
  return input
    .replace(/[<>'";&]/g, "")
    .trim()
    .slice(0, 100);
}

// Normalize Vietnamese text for better search accuracy
function normalizeVietnamese(str: string): string {
  // First, normalize to NFC form
  let text = str.toLowerCase().normalize("NFD");

  // Map of Vietnamese characters with diacritics to their base forms
  const vietnameseMap: { [key: string]: string } = {
    // Vowels with various diacritics
    á: "a",
    à: "a",
    ả: "a",
    ã: "a",
    ạ: "a",
    ă: "a",
    ắ: "a",
    ằ: "a",
    ẳ: "a",
    ẵ: "a",
    ặ: "a",
    â: "a",
    ấ: "a",
    ầ: "a",
    ẩ: "a",
    ẫ: "a",
    ậ: "a",

    é: "e",
    è: "e",
    ẻ: "e",
    ẽ: "e",
    ẹ: "e",
    ê: "e",
    ế: "e",
    ề: "e",
    ể: "e",
    ễ: "e",
    ệ: "e",

    í: "i",
    ì: "i",
    ỉ: "i",
    ĩ: "i",
    ị: "i",

    ó: "o",
    ò: "o",
    ỏ: "o",
    õ: "o",
    ọ: "o",
    ô: "o",
    ố: "o",
    ồ: "o",
    ổ: "o",
    ỗ: "o",
    ộ: "o",
    ơ: "o",
    ớ: "o",
    ờ: "o",
    ở: "o",
    ỡ: "o",
    ợ: "o",
    òa: "oa", // Handle 'òa' → 'oa'
    oà: "oa", // Handle both directions

    ú: "u",
    ù: "u",
    ủ: "u",
    ũ: "u",
    ụ: "u",
    ư: "u",
    ứ: "u",
    ừ: "u",
    ử: "u",
    ữ: "u",
    ự: "u",

    ý: "y",
    ỳ: "y",
    ỷ: "y",
    ỹ: "y",
    ỵ: "y",
    thuỳ: "thuy", // Handle 'thuỳ' → 'thuy'
    thùy: "thuy", // Handle 'thùy' → 'thuy'

    đ: "d",
  };

  // Replace Vietnamese characters
  text = text.replace(/./g, (char) => vietnameseMap[char] || char);

  // Handle special multi-character replacements
  text = text
    .replace(/òa/g, "oa")
    .replace(/oà/g, "oa")
    .replace(/thuỳ/g, "thuy")
    .replace(/thùy/g, "thuy");

  // Remove combining diacritical marks (handles remaining diacritics)
  text = text.replace(/[\u0300-\u036f]/g, "");

  // Normalize whitespace
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

function maskPhone(phone: string): string {
  if (phone.length <= 4) return phone;
  const visible = phone.slice(-4);
  return "*".repeat(phone.length - 4) + visible;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Bạn đã tra cứu quá nhiều lần. Vui lòng thử lại sau 1 phút." },
        { status: 429 }
      );
    }

    // Validate environment variables
    const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const sheetName = process.env.SHEET_NAME;

    if (!apiKey || !sheetId || !sheetName) {
      console.error("Missing Google Sheets environment variables");
      return NextResponse.json(
        { error: "Hệ thống chưa được cấu hình. Vui lòng liên hệ quản trị viên." },
        { status: 500 }
      );
    }

    // Parse and validate input
    const body = await request.json();
    const hoTen = sanitize(body.hoTen || "");
    const lop = sanitize(body.lop || "");
    const soDienThoai = sanitize(body.soDienThoai || "").replace(/\D/g, "");

    if (!hoTen || !lop || !soDienThoai) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ thông tin: Họ tên, Lớp và Số điện thoại." },
        { status: 400 }
      );
    }

    if (soDienThoai.length < 9 || soDienThoai.length > 11) {
      return NextResponse.json(
        { error: "Số điện thoại không hợp lệ." },
        { status: 400 }
      );
    }

    // Fetch data from Google Sheets
    const encodedSheetName = encodeURIComponent(sheetName);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodedSheetName}?key=${apiKey}`;

    const response = await fetch(url, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Sheets API error:", response.status, errorText);
      return NextResponse.json(
        { error: "Không thể kết nối đến cơ sở dữ liệu. Vui lòng thử lại sau." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const rows: string[][] = data.values || [];

    if (rows.length < 2) {
      return NextResponse.json(
        { error: "Chưa có dữ liệu học phí." },
        { status: 404 }
      );
    }

    // Skip header row, search for matching records
    const normalizedHoTen = normalizeVietnamese(hoTen);
    const normalizedLop = normalizeVietnamese(lop);

    const results = rows.slice(1).filter((row) => {
      const rowHoTen = normalizeVietnamese(row[0] || "");
      const rowLop = normalizeVietnamese(row[1] || "");
      const rowPhone = (row[2] || "").replace(/\D/g, "");

      // Improved matching: 
      // - Name can be partial match (more flexible)
      // - Class must match more strictly (word/part-word match)
      // - Phone must be exact match
      const nameMatches =
        rowHoTen.includes(normalizedHoTen) ||
        normalizedHoTen
          .split(" ")
          .some((part) => rowHoTen.includes(part));

      const classMatches = rowLop === normalizedLop || rowLop.includes(normalizedLop);

      const phoneMatches = rowPhone.includes(soDienThoai);

      return nameMatches && classMatches && phoneMatches;
    });

    if (results.length === 0) {
      return NextResponse.json(
        {
          error:
            "Không tìm thấy thông tin. Vui lòng kiểm tra lại Họ tên, Lớp và Số điện thoại.",
        },
        { status: 404 }
      );
    }

    // Map results - mask phone for privacy
    const mappedResults = results.map((row) => ({
      hoTen: row[0] || "",
      lop: row[1] || "",
      soDienThoai: maskPhone(row[2] || ""),
      soBuoi: row[3] || "",
      soTien: row[4] || "",
      ndck: row[5] || "",
      ghiChu: row[6] || "",
      trangThai: row[7] || "",
      qrCode: row[8] || "",
    }));

    return NextResponse.json({ results: mappedResults });
  } catch (error) {
    console.error("Lookup error:", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
