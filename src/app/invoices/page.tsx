import { ResourcePage } from "@/components/resource-page";

export default function InvoicesPage() {
  return <ResourcePage title="Invoices" description="Issue invoices and follow payment status." action="New invoice" columns={["Invoice", "Client", "Status", "Amount"]} rows={[]} />;
}
