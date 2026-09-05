import { ProjectProfile } from "@/components/project-profile";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectProfile id={id} />;
}
