"use client";

export function DeleteConfirmDialog({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = "حذف",
  cancelText = "إلغاء",
}: {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
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
            className="inline-flex min-w-20 items-center justify-center rounded-lg border border-red-700 bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800 dark:border-red-500 dark:bg-red-600 dark:hover:bg-red-500"
          >
            {confirmText}
          </button>
        </div>
      </section>
    </div>
  );
}
