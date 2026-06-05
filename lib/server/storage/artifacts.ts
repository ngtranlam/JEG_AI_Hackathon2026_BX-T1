import path from "node:path";

const DEFAULT_OUTPUT_DIR = "./outputs/generated";

function resolveOutputRoot() {
  return path.resolve(process.cwd(), process.env.LOCAL_OUTPUT_DIR ?? DEFAULT_OUTPUT_DIR);
}

export function getProjectArtifactRoot(projectId: string) {
  return path.join(resolveOutputRoot(), projectId);
}

export function getProjectVariantDir(projectId: string, variantId: string) {
  return path.join(getProjectArtifactRoot(projectId), "variants", variantId);
}

export function getProjectNodeDir(projectId: string, nodeId: string) {
  return path.join(getProjectArtifactRoot(projectId), "nodes", nodeId);
}

export function getVariantNodeDir(
  projectId: string,
  variantId: string,
  nodeId: string,
) {
  return path.join(getProjectVariantDir(projectId, variantId), "nodes", nodeId);
}

export function buildArtifactPath(input: {
  projectId: string;
  nodeId: string;
  fileName: string;
  variantId?: string;
}) {
  const targetDir = input.variantId
    ? getVariantNodeDir(input.projectId, input.variantId, input.nodeId)
    : getProjectNodeDir(input.projectId, input.nodeId);

  return path.join(targetDir, input.fileName);
}
