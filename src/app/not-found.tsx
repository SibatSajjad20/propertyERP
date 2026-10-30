import { NotFoundState } from "@/components/error-state";

export default function RootNotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-[720px] items-start px-6 py-16">
      <NotFoundState />
    </div>
  );
}
