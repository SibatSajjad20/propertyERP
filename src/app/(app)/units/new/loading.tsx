import { PageSkeleton } from "@/components/page-skeleton";

export default function NewUnitLoading() {
  return <PageSkeleton rows={6} label="Loading create unit…" />;
}
