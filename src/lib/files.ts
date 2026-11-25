export const IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
];

const DOC_CONTENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv",
};

export const TEXT_EXTENSIONS = [
  "txt", "md", "csv", "json", "xml", "html", "css", "js", "jsx", "ts", "tsx",
  "py", "java", "c", "cpp", "cs", "go", "rs", "rb", "php", "sh", "sql", "yml", "yaml",
];

export const DOC_ALLOWED_CONTENT_TYPES = [
  "application/pdf",
  DOC_CONTENT_TYPES.docx,
  DOC_CONTENT_TYPES.xlsx,
  "text/csv",
  "text/plain",
];

export function extensionOf(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export function isDocumentName(name: string): boolean {
  const ext = extensionOf(name);
  return ext in DOC_CONTENT_TYPES || TEXT_EXTENSIONS.includes(ext);
}

export function docContentType(name: string): string {
  return DOC_CONTENT_TYPES[extensionOf(name)] ?? "text/plain";
}

export const FILE_ACCEPT = [
  ...IMAGE_TYPES,
  ...Object.keys(DOC_CONTENT_TYPES).map((e) => `.${e}`),
  ...TEXT_EXTENSIONS.map((e) => `.${e}`),
].join(",");