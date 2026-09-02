import { prisma } from '@/lib/db/prisma';
import { requireRole } from '@/lib/auth/queries';
import { ImportForm } from './import-form';

export default async function Page() {
  const user = await requireRole('TEACHER', 'ADMIN');
  const lessons = await prisma.lesson.findMany({
    where: user.role === 'ADMIN' ? {} : { teacherId: user.id },
    select: { id: true, title: true },
    orderBy: { updatedAt: 'desc' },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="text-2xl font-bold">Thêm từ vựng</h2>
      <p className="mt-2 mb-6 text-sm text-muted-foreground">
        Tạo bộ từ mới hoặc bổ sung từ vào bộ hiện có bằng Excel. Hệ thống tự bỏ dòng trùng và giữ nguyên các từ đã có.
      </p>
      <ImportForm lessons={lessons} />
    </div>
  );
}
