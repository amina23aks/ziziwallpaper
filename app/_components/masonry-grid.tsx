import type { ReactNode } from "react";

export function MasonryGrid({ children }: { children: ReactNode }) {
  return (
    <section className="columns-2 gap-2 [column-fill:balance] sm:columns-3 sm:gap-3 lg:columns-4 lg:gap-3 xl:columns-5">
      {children}
    </section>
  );
}
