import { BriefDetailView } from "@/components/brief-detail-view";

export default async function BriefDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BriefDetailView briefId={id} />;
}
