import { ClientProfile } from "@/components/client-profile";

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClientProfile id={id} />;
}
