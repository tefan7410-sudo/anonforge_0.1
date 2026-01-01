// Filename format: {order}_{category}_{trait}.png
// Example: 00_body_warrior.png -> { order: 0, category: 'body', trait: 'warrior' }

export interface ParsedFilename {
  order: number;
  category: string;
  trait: string;
  isValid: boolean;
  error?: string;
}

export const FILENAME_FORMAT = '{order}_{category}_{trait}.png';
export const FILENAME_REGEX = /^(\d+)_([a-zA-Z0-9]+)_([a-zA-Z0-9_-]+)\.(png|PNG)$/;

export function parseFilename(filename: string): ParsedFilename {
  const match = filename.match(FILENAME_REGEX);
  
  if (!match) {
    return {
      order: 0,
      category: '',
      trait: '',
      isValid: false,
      error: `Invalid format. Expected: ${FILENAME_FORMAT}`,
    };
  }

  const [, orderStr, category, trait] = match;
  const order = parseInt(orderStr, 10);

  return {
    order,
    category: category.toLowerCase(),
    trait,
    isValid: true,
  };
}

export function validateFilenames(files: File[]): {
  valid: ParsedFilename[];
  invalid: { file: File; error: string }[];
} {
  const valid: ParsedFilename[] = [];
  const invalid: { file: File; error: string }[] = [];

  for (const file of files) {
    const parsed = parseFilename(file.name);
    if (parsed.isValid) {
      valid.push({ ...parsed, trait: parsed.trait });
    } else {
      invalid.push({ file, error: parsed.error || 'Unknown error' });
    }
  }

  return { valid, invalid };
}

export function groupByCategory(
  parsedFiles: { file: File; parsed: ParsedFilename }[]
): Map<string, { files: { file: File; parsed: ParsedFilename }[]; minOrder: number }> {
  const groups = new Map<string, { files: { file: File; parsed: ParsedFilename }[]; minOrder: number }>();

  for (const item of parsedFiles) {
    const category = item.parsed.category;
    const existing = groups.get(category);

    if (!existing) {
      groups.set(category, { files: [item], minOrder: item.parsed.order });
    } else {
      existing.files.push(item);
      existing.minOrder = Math.min(existing.minOrder, item.parsed.order);
    }
  }

  // Sort files within each group by order
  for (const [, group] of groups) {
    group.files.sort((a, b) => a.parsed.order - b.parsed.order);
  }

  return groups;
}
