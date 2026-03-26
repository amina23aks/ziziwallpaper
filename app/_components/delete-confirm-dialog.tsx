"use client";

export function DeleteConfirmDialog({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = "حذف",
  cancelText = "إلغاء",
  confirmVariant = "soft",
}: {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "soft" | "destructive";
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 px-4" onClick={onCancel}>
      <section
        className="w-full max-w-sm space-y-3 rounded-2xl border border-[color:var(--app-border)] bg-[var(--app-surface)] p-4 text-right shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-base font-bold text-[var(--app-text)]">{title}</h2>
        <p className="text-sm leading-6 text-[var(--app-text-muted)]">{description}</p>
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-w-20 items-center justify-center rounded-lg border border-[color:var(--app-border)] px-3 py-2 text-sm font-semibold text-[var(--app-text)]"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`inline-flex min-w-20 items-center justify-center rounded-lg border px-3 py-2 text-sm font-semibold ${
              confirmVariant === "destructive"
                ? "border-red-200 bg-white text-red-700 hover:bg-red-50 dark:border-[#8f1d2a] dark:bg-[#34131a] dark:text-[#ff9eaa] dark:hover:bg-[#412029]"
                : "border-[#f3b6bc] bg-[#fff5f6] text-[#c40018] hover:bg-[#ffebee] dark:border-[#8f1d2a] dark:bg-[#34131a] dark:text-[#ff9eaa] dark:hover:bg-[#412029]"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </section>
    </div>
  );
}
