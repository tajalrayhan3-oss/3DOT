import { ResourcePage } from "@/components/resource-page";

export default function TeamPage() {
  return <ResourcePage title="Team" description="Manage employees, roles and site access." action="Add employee" columns={["Employee", "Role", "Status", "Monthly cost"]} rows={[]} />;
}
