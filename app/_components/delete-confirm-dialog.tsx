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
        className="w-full max-w-sm space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 text-right shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{title}</h2>
        <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">{description}</p>
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-w-20 items-center justify-center rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex min-w-20 items-center justify-center rounded-lg border border-red-300 bg-red-50/40 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-800/70 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30"
          >
            {confirmText}
          </button>
        </div>
      </section>
    </div>
  );
}
