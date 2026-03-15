"use client";

export function DeleteConfirmDialog({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 px-4" onClick={onCancel}>
      <section
        className="w-full max-w-sm space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 text-right shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-base font-bold text-zinc-900">{title}</h2>
        <p className="text-sm leading-6 text-zinc-600">{description}</p>
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-w-20 items-center justify-center rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex min-w-20 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
          >
            حذف
          </button>
        </div>
      </section>
    </div>
  );
}
