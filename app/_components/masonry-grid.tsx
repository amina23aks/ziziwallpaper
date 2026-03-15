import type { ReactNode } from "react";

export function MasonryGrid({ children }: { children: ReactNode }) {
  return <section className="columns-2 gap-3 sm:columns-3 lg:columns-4 xl:columns-5">{children}</section>;
}
