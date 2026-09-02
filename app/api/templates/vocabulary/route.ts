import * as XLSX from 'xlsx';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const workbook = XLSX.utils.book_new();

  const vocabularySheet = XLSX.utils.aoa_to_sheet([
    ['Từ', 'Nghĩa', 'Ví dụ'],
  ]);
  vocabularySheet['!cols'] = [{ wch: 24 }, { wch: 30 }, { wch: 48 }];
  XLSX.utils.book_append_sheet(workbook, vocabularySheet, 'Tu_vung');

  const guideSheet = XLSX.utils.aoa_to_sheet([
    ['HƯỚNG DẪN NHẬP TỪ VỰNG'],
    [],
    ['Bước', 'Thực hiện'],
    ['1', 'Mở sheet Tu_vung.'],
    ['2', 'Mỗi dòng là một thẻ từ vựng.'],
    ['3', 'Cột Từ và Nghĩa là bắt buộc; Ví dụ có thể để trống.'],
    ['4', 'Không đổi tên ba cột ở hàng đầu tiên.'],
    [],
    ['Ví dụ', 'Nghĩa', 'Câu ví dụ'],
    ['abandon', 'từ bỏ', 'They had to abandon the plan.'],
    ['accurate', 'chính xác', 'The information is accurate.'],
    ['achieve', 'đạt được', 'She worked hard to achieve her goal.'],
  ]);
  guideSheet['!cols'] = [{ wch: 24 }, { wch: 34 }, { wch: 48 }];
  XLSX.utils.book_append_sheet(workbook, guideSheet, 'Huong_dan');

  const body = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

  return new Response(body, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="Mau_nhap_tu_vung_Quizlet.xlsx"',
      'Cache-Control': 'no-store',
    },
  });
}
