import { FinancialDocument } from "@/components/financial-document";

export default async function QuotationDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FinancialDocument type="quotations" id={id} />;
}
