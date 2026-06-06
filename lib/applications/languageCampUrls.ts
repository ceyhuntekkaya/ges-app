export function applicationsUrlForProject(projectId: string, participantId?: string) {
  const params = new URLSearchParams();
  params.set("tab", `camp-proj-${projectId}`);
  if (participantId) params.set("participant", participantId);
  return `/applications?${params.toString()}`;
}
