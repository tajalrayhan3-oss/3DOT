import { FinancialDocument } from "@/components/financial-document";

export default async function InvoiceDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FinancialDocument type="invoices" id={id} />;
}
