import { ResourcePage } from "@/components/resource-page";

export default function TimesheetsPage() {
  return <ResourcePage title="Timesheets" description="Track work hours across every construction site." action="Add timesheet" columns={["Employee", "Project", "Status", "Hours"]} rows={[]} />;
}
