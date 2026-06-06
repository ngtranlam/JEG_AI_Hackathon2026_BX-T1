async function main() {
  const baseUrl = process.argv[2] ?? "http://localhost:3000";

  const payload = {
    brief: {
      brandName: "Watch3000",
      productName: "Healthy salad delivery",
      productDescription: "Fresh, chef-prepared salads delivered to your office.",
      audience: "Office workers 25-35",
      platforms: ["TikTok"],
      targetDuration: 15,
      aspectRatio: "9:16",
      resolution: "720p",
      brandTone: "fresh, energetic, trustworthy",
      mainMessage: "Healthy eating made effortless.",
      complianceConstraints: "No fast weight-loss claims.",
      callToAction: "Order now",
      objective: "Drive first orders for lunch delivery",
      offer: "Free delivery for first order",
      prohibitedClaims: ["Lose 5kg in 7 days"],
      references: ["Clean bright realistic food shots, fast cuts, subtitle-heavy."],
    },
    brandKit: {
      primaryColorHex: "#2E7D32",
      secondaryColorHex: "#FFFFFF",
      fontFamily: "Montserrat",
      tagline: "Eat healthy without meal prep",
      visualNotes: ["Clean, bright, modern", "Realistic product shots"],
      forbiddenWords: ["miracle", "guaranteed"],
      assets: [
        {
          type: "product-image",
          fileName: "ref.png",
          filePath:
            "uploads/90b28f57-4055-427c-b567-eee5a0d64dde-screenshot-2026-06-05-at-20.51.06.png",
          mimeType: "image/png",
          publicUrl:
            "/uploads/90b28f57-4055-427c-b567-eee5a0d64dde-screenshot-2026-06-05-at-20.51.06.png",
        },
      ],
    },
  };

  const createRes = await fetch(`${baseUrl}/api/projects`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const created = await createRes.json();
  if (!createRes.ok) {
    throw new Error(JSON.stringify(created));
  }

  const projectId = created.project.projectId as string;
  console.log("PROJECT", projectId);

  const generateRes = await fetch(`${baseUrl}/api/projects/${projectId}/generate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  const queued = await generateRes.json();
  if (!generateRes.ok) {
    throw new Error(JSON.stringify(queued));
  }

  console.log("ENQUEUED", queued.project.status);

  for (let i = 0; i < 18; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const pollRes = await fetch(`${baseUrl}/api/projects/${projectId}`, {
      cache: "no-store",
    });
    const polled = await pollRes.json();
    if (!pollRes.ok) {
      throw new Error(JSON.stringify(polled));
    }

    const workflowStatus = polled.project.workflowStatus as Record<
      string,
      { status: string; errorMessage?: string; logs?: string[] }
    >;

    const active = Object.entries(workflowStatus)
      .filter(([, node]) => node.status === "running" || node.status === "failed")
      .map(([id, node]) => ({
        id,
        status: node.status,
        error: node.errorMessage ?? null,
        lastLog: node.logs?.at(-1) ?? null,
      }));

    const completedCount = Object.values(workflowStatus).filter(
      (node) => node.status === "completed",
    ).length;

    console.log(
      "TICK",
      i + 1,
      "STATUS",
      polled.project.status,
      "ACTIVE",
      JSON.stringify(active),
      "DONE",
      completedCount,
    );

    if (polled.project.status === "completed" || polled.project.status === "failed") {
      console.log(JSON.stringify(polled.project, null, 2));
      break;
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exit(1);
});
