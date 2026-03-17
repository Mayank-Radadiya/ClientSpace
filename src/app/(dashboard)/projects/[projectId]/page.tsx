export default function ProjectDetailPage({
  params,
}: {
  params: { projectId: string };
}) {
  return (
    <div className="p-6">
      Project detail — coming in a future task. ID: {params.projectId}
    </div>
  );
}
