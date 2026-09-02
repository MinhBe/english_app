# Security

Ứng dụng dùng Supabase Auth để xác thực. Prisma kết nối trực tiếp PostgreSQL nên không dựa vào Supabase RLS cho các truy vấn Prisma. Mọi Server Action nghiệp vụ phải gọi `requireUser()` hoặc `requireRole()` trước khi đọc/ghi dữ liệu và phải kiểm tra ownership của lesson khi áp dụng.
