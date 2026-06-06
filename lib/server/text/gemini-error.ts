export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function formatGeminiFallbackLog(nodeName: string, error: unknown) {
  return `${nodeName} fell back to deterministic/code-based planning because Gemini was unavailable: ${getErrorMessage(error)}`;
}
