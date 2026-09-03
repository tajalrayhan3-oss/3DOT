import { ResourcePage } from "@/components/resource-page";

export default function QuotationsPage() {
  return <ResourcePage title="Quotations" description="Create professional quotes and send them to clients." action="New quotation" columns={["Quotation", "Client", "Status", "Amount"]} rows={[]} />;
}
