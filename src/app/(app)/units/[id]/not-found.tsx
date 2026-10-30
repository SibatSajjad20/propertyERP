import { NotFoundState } from "@/components/error-state";

export default function UnitNotFound() {
  return (
    <NotFoundState
      title="Unit not found"
      description="That unit is not on the ledger. It may have been archived, or the link is wrong."
    />
  );
}
