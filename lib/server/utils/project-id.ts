function slugify(value: string) {
  const fallback = "project";

  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || fallback;
}

export function generateProjectId(seed: string) {
  return `${slugify(seed)}-${crypto.randomUUID().slice(0, 8)}`;
}
