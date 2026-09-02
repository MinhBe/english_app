const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_FILE_SIGNATURE = 0x02014b50;
const MAX_EOCD_SEARCH = 65_557;

const DEFAULT_LIMITS = {
  maxEntries: 5_000,
  maxEntryUncompressedBytes: 16 * 1024 * 1024,
  maxTotalUncompressedBytes: 32 * 1024 * 1024,
} as const;

export class InvalidXlsxArchiveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidXlsxArchiveError';
  }
}

function findEndOfCentralDirectory(view: DataView) {
  const minimumOffset = Math.max(0, view.byteLength - MAX_EOCD_SEARCH);

  for (let offset = view.byteLength - 22; offset >= minimumOffset; offset -= 1) {
    if (view.getUint32(offset, true) === EOCD_SIGNATURE) {
      return offset;
    }
  }

  return -1;
}

export function validateXlsxArchive(
  buffer: ArrayBuffer,
  limits: {
    maxEntries?: number;
    maxEntryUncompressedBytes?: number;
    maxTotalUncompressedBytes?: number;
  } = {},
) {
  if (buffer.byteLength < 22) {
    throw new InvalidXlsxArchiveError('Nội dung file không phải workbook .xlsx hợp lệ.');
  }

  const resolved = { ...DEFAULT_LIMITS, ...limits };
  const view = new DataView(buffer);
  const eocdOffset = findEndOfCentralDirectory(view);

  if (eocdOffset < 0) {
    throw new InvalidXlsxArchiveError('Không tìm thấy ZIP central directory của file .xlsx.');
  }

  const diskNumber = view.getUint16(eocdOffset + 4, true);
  const centralDirectoryDisk = view.getUint16(eocdOffset + 6, true);
  const entriesOnDisk = view.getUint16(eocdOffset + 8, true);
  const totalEntries = view.getUint16(eocdOffset + 10, true);
  const centralDirectorySize = view.getUint32(eocdOffset + 12, true);
  const centralDirectoryOffset = view.getUint32(eocdOffset + 16, true);

  if (diskNumber !== 0 || centralDirectoryDisk !== 0 || entriesOnDisk !== totalEntries) {
    throw new InvalidXlsxArchiveError('Không hỗ trợ workbook ZIP nhiều volume.');
  }

  if (
    totalEntries === 0xffff ||
    centralDirectorySize === 0xffffffff ||
    centralDirectoryOffset === 0xffffffff
  ) {
    throw new InvalidXlsxArchiveError('Không hỗ trợ ZIP64 cho luồng import này.');
  }

  if (totalEntries === 0 || totalEntries > resolved.maxEntries) {
    throw new InvalidXlsxArchiveError(
      `Workbook có số entry ZIP không hợp lệ hoặc vượt giới hạn ${resolved.maxEntries}.`,
    );
  }

  const centralDirectoryEnd = centralDirectoryOffset + centralDirectorySize;
  if (centralDirectoryEnd > eocdOffset || centralDirectoryOffset >= view.byteLength) {
    throw new InvalidXlsxArchiveError('ZIP central directory bị hỏng.');
  }

  let offset = centralDirectoryOffset;
  let totalUncompressedBytes = 0;

  for (let index = 0; index < totalEntries; index += 1) {
    if (offset + 46 > view.byteLength || view.getUint32(offset, true) !== CENTRAL_FILE_SIGNATURE) {
      throw new InvalidXlsxArchiveError('ZIP central directory có entry không hợp lệ.');
    }

    const generalPurposeFlags = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const fileNameLength = view.getUint16(offset + 28, true);
    const extraFieldLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);

    if ((generalPurposeFlags & 0x0001) !== 0) {
      throw new InvalidXlsxArchiveError('Không hỗ trợ file .xlsx được mã hóa bằng mật khẩu.');
    }

    if (uncompressedSize === 0xffffffff || compressedSize === 0xffffffff) {
      throw new InvalidXlsxArchiveError('Không hỗ trợ ZIP64 entry cho luồng import này.');
    }

    if (uncompressedSize > resolved.maxEntryUncompressedBytes) {
      throw new InvalidXlsxArchiveError(
        `Một thành phần trong workbook vượt giới hạn giải nén ${Math.round(resolved.maxEntryUncompressedBytes / 1024 / 1024)} MB.`,
      );
    }

    totalUncompressedBytes += uncompressedSize;
    if (totalUncompressedBytes > resolved.maxTotalUncompressedBytes) {
      throw new InvalidXlsxArchiveError(
        `Workbook vượt giới hạn ${Math.round(resolved.maxTotalUncompressedBytes / 1024 / 1024)} MB sau giải nén.`,
      );
    }

    offset += 46 + fileNameLength + extraFieldLength + commentLength;
    if (offset > centralDirectoryEnd) {
      throw new InvalidXlsxArchiveError('ZIP central directory bị cắt ngắn.');
    }
  }

  return {
    totalEntries,
    totalUncompressedBytes,
  };
}
