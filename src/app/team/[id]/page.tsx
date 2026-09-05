import { EmployeeProfile } from "@/components/employee-profile";

export default async function TeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EmployeeProfile id={id} />;
}
