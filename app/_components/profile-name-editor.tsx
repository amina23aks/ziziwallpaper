"use client";

import { Check, Pencil, X } from "lucide-react";
import { useEffect, useState } from "react";

export function ProfileNameEditor({
  value,
  onSave,
  isSaving,
}: {
  value: string;
  onSave: (nextValue: string) => Promise<void>;
  isSaving: boolean;
}) {
  const [draftValue, setDraftValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setDraftValue(value);
  }, [value]);

  const hasChanges = draftValue.trim() && draftValue.trim() !== value.trim();

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-700">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-zinc-500">الاسم الظاهر</p>
          {!isEditing ? (
            <p className="mt-1 text-base font-semibold text-zinc-900">{value || "بدون اسم"}</p>
          ) : null}
        </div>

        {!isEditing ? (
          <button
            type="button"
            onClick={() => {
              setDraftValue(value);
              setStatus("");
              setIsEditing(true);
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700"
            aria-label="تعديل الاسم الظاهر"
          >
            <Pencil size={15} />
          </button>
        ) : null}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <input
            value={draftValue}
            onChange={(event) => setDraftValue(event.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500"
            placeholder="الاسم الظاهر"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSaving || !hasChanges}
              onClick={async () => {
                await onSave(draftValue.trim());
                setStatus("تم تحديث الاسم.");
                setIsEditing(false);
              }}
              className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              <Check size={14} />
              حفظ
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => {
                setDraftValue(value);
                setStatus("");
                setIsEditing(false);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700"
            >
              <X size={14} />
              إلغاء
            </button>
          </div>
        </div>
      ) : null}

      {status ? <p className="mt-2 text-xs text-green-700">{status}</p> : null}
    </div>
  );
}
