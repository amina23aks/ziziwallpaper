import clsx from "clsx";
import type { ReactNode } from "react";

type MasonryGridProps = {
  children: ReactNode;
  className?: string;
};

export function MasonryGrid({ children, className }: MasonryGridProps) {
  return (
    <section
      className={clsx(
        "columns-2 gap-2 [column-fill:balance] sm:columns-3 sm:gap-3 lg:columns-4 lg:gap-3 xl:columns-5",
        className
      )}
    >
      {children}
    </section>
  );
}
