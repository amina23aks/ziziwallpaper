"use client";

import { MessageCircleMore, Send } from "lucide-react";
import { useMemo, useState } from "react";
import type { WallpaperComment } from "@/types/comment";

function formatTimestamp(value?: WallpaperComment["createdAt"]) {
  const seconds = (value as { seconds?: number } | null | undefined)?.seconds;
  if (!seconds) return "";

  return new Intl.DateTimeFormat("ar", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(seconds * 1000));
}

function avatarLabel(name: string) {
  return name.trim().charAt(0).toUpperCase() || "؟";
}

function InlineReplyInput({
  value,
  onChange,
  onSubmit,
  onCancel,
  isSaving,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}) {
  return (
    <div className="mt-3 rounded-2xl border border-zinc-200 bg-white px-3 py-2.5">
      <div className="flex items-center gap-2 [direction:ltr]">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="اكتب ردك..."
          className="w-full bg-transparent text-right text-sm text-zinc-900 placeholder:text-zinc-400 outline-none"
        />
        <button
          type="button"
          onClick={async () => onSubmit()}
          disabled={isSaving || !value.trim()}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white disabled:opacity-50"
          aria-label="إرسال الرد"
        >
          <Send size={14} />
        </button>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="mt-2 text-xs font-medium text-zinc-500"
      >
        إلغاء
      </button>
    </div>
  );
}

function FeedbackItem({
  item,
  replies,
  activeReplyId,
  activeReplyText,
  onReplyToggle,
  onReplyTextChange,
  onReplySubmit,
  canReply,
  isSaving,
}: {
  item: WallpaperComment;
  replies: WallpaperComment[];
  activeReplyId: string | null;
  activeReplyText: string;
  onReplyToggle: (id: string) => void;
  onReplyTextChange: (value: string) => void;
  onReplySubmit: (parentId: string) => Promise<void>;
  canReply: boolean;
  isSaving: boolean;
}) {
  const isReplying = activeReplyId === item.id;

  return (
    <article className="border-b border-zinc-100 py-3 last:border-b-0">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold text-zinc-700">
          {avatarLabel(item.userDisplayName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="font-semibold text-zinc-900">{item.userDisplayName}</span>
            {formatTimestamp(item.createdAt) ? <span>{formatTimestamp(item.createdAt)}</span> : null}
          </div>
          <p className="mt-1 whitespace-pre-line text-sm leading-6 text-zinc-700">{item.content}</p>
          {canReply && item.id ? (
            <button
              type="button"
              onClick={() => onReplyToggle(item.id as string)}
              className="mt-2 text-xs font-medium text-zinc-500 hover:text-zinc-800"
            >
              رد
            </button>
          ) : null}

          {isReplying && item.id ? (
            <InlineReplyInput
              value={activeReplyText}
              onChange={onReplyTextChange}
              onSubmit={() => onReplySubmit(item.id as string)}
              onCancel={() => onReplyToggle(item.id as string)}
              isSaving={isSaving}
            />
          ) : null}

          {replies.length > 0 ? (
            <div className="mt-3 space-y-3 border-r border-zinc-200 pr-4">
              {replies.map((reply) => (
                <div key={reply.id} className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-bold text-zinc-600">
                    {avatarLabel(reply.userDisplayName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <span className="font-semibold text-zinc-900">{reply.userDisplayName}</span>
                      {formatTimestamp(reply.createdAt) ? <span>{formatTimestamp(reply.createdAt)}</span> : null}
                    </div>
                    <p className="mt-1 whitespace-pre-line text-sm leading-6 text-zinc-700">{reply.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function FeedbackSection({
  comments,
  isSignedIn,
  currentUserName,
  onLogin,
  onSubmitFeedback,
  onSubmitReply,
  isSaving,
}: {
  comments: WallpaperComment[];
  isSignedIn: boolean;
  currentUserName: string;
  onLogin: () => void;
  onSubmitFeedback: (value: string) => Promise<void>;
  onSubmitReply: (parentId: string, value: string) => Promise<void>;
  isSaving: boolean;
}) {
  const [feedbackText, setFeedbackText] = useState("");
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [activeReplyText, setActiveReplyText] = useState("");

  const rootComments = useMemo(() => comments.filter((item) => !item.parentId), [comments]);
  const repliesByParent = useMemo(() => {
    const map = new Map<string, WallpaperComment[]>();
    comments.filter((item) => item.parentId).forEach((item) => {
      const key = item.parentId as string;
      map.set(key, [...(map.get(key) ?? []), item]);
    });
    return map;
  }, [comments]);

  return (
    <section id="comments" className="space-y-3 rounded-2xl border border-zinc-200/80 bg-white px-4 py-4 shadow-sm [direction:rtl]">
      <div className="flex items-center gap-2">
        <MessageCircleMore size={18} className="text-zinc-500" />
        <h2 className="text-base font-bold text-zinc-900">الآراء</h2>
      </div>

      {rootComments.length === 0 ? (
        <p className="text-sm text-zinc-500">لا توجد آراء حتى الآن.</p>
      ) : (
        <div className="max-h-[360px] overflow-y-auto pr-1">
          {rootComments.map((comment) => (
            <FeedbackItem
              key={comment.id}
              item={comment}
              replies={repliesByParent.get(comment.id ?? "") ?? []}
              activeReplyId={activeReplyId}
              activeReplyText={activeReplyText}
              onReplyToggle={(id) => {
                if (activeReplyId === id) {
                  setActiveReplyId(null);
                  setActiveReplyText("");
                  return;
                }
                setActiveReplyId(id);
                setActiveReplyText("");
              }}
              onReplyTextChange={setActiveReplyText}
              onReplySubmit={async (parentId) => {
                if (!activeReplyText.trim()) return;
                await onSubmitReply(parentId, activeReplyText);
                setActiveReplyText("");
                setActiveReplyId(null);
              }}
              canReply={isSignedIn}
              isSaving={isSaving}
            />
          ))}
        </div>
      )}

      {isSignedIn ? (
        <form
          className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2.5"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!feedbackText.trim()) return;
            await onSubmitFeedback(feedbackText);
            setFeedbackText("");
          }}
        >
          <div className="mb-2 flex items-center gap-2 text-xs text-zinc-500">
            <span className="font-semibold text-zinc-800">{currentUserName}</span>
            <span>أضف رأيك</span>
          </div>
          <div className="flex items-center gap-2 [direction:ltr]">
            <input
              value={feedbackText}
              onChange={(event) => setFeedbackText(event.target.value)}
              placeholder="اكتب رأيك بشكل مختصر..."
              className="w-full bg-transparent text-right text-sm text-zinc-900 placeholder:text-zinc-400 outline-none"
            />
            <button
              type="submit"
              disabled={isSaving || !feedbackText.trim()}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white disabled:opacity-50"
              aria-label="إرسال الرأي"
            >
              <Send size={14} />
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-700">
          <p>سجّل الدخول لإضافة رأيك أو الرد على الآخرين.</p>
          <button
            type="button"
            onClick={onLogin}
            className="mt-2 rounded-lg border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white"
          >
            تسجيل الدخول
          </button>
        </div>
      )}
    </section>
  );
}
