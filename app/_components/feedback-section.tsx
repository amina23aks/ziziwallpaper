"use client";

import {
  Check,
  ChevronDown,
  MessageCircleMore,
  MoreHorizontal,
  Pencil,
  Send,
  Trash2,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CommentDisplayIdentityMode, WallpaperComment } from "@/types/comment";

const DISPLAY_IDENTITY_OPTIONS: Array<{
  value: CommentDisplayIdentityMode;
  subtitle: string;
}> = [
  { value: "real", subtitle: "النشر باسم ملفك الشخصي" },
  { value: "anonymous", subtitle: "إخفاء اسمك الحقيقي" },
  { value: "blouza", subtitle: "النشر باسم بلوزة" },
];

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

function getVisibleName(comment: Pick<WallpaperComment, "userDisplayName" | "displayIdentityMode" | "isAnonymous">) {
  if (comment.displayIdentityMode === "anonymous") return "Anonymous";
  if (comment.displayIdentityMode === "blouza") return "بلوزة";
  if (comment.isAnonymous) return "بلوزة";
  return comment.userDisplayName;
}

function getIdentityLabel(mode: CommentDisplayIdentityMode, realName: string) {
  if (mode === "real") return realName;
  if (mode === "anonymous") return "Anonymous";
  return "بلوزة";
}

function avatarLabel(name: string) {
  return name.trim().charAt(0).toUpperCase() || "؟";
}

function wasEdited(comment: Pick<WallpaperComment, "createdAt" | "updatedAt">) {
  const createdSeconds = (comment.createdAt as { seconds?: number } | null | undefined)?.seconds;
  const updatedSeconds = (comment.updatedAt as { seconds?: number } | null | undefined)?.seconds;

  if (!createdSeconds || !updatedSeconds) return false;
  return updatedSeconds > createdSeconds;
}

function isAdminAuthor(comment: Pick<WallpaperComment, "isAdminAuthor" | "isAdminReply">) {
  return Boolean(comment.isAdminAuthor ?? comment.isAdminReply);
}

function AvatarBadge({
  name,
  subtle = false,
  className = "",
}: {
  name: string;
  subtle?: boolean;
  className?: string;
}) {
  return (
    <div
      className={[
        "flex items-center justify-center rounded-full text-xs font-bold",
        subtle ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100" : "bg-zinc-900/90 text-white dark:bg-zinc-100 dark:text-zinc-900",
        subtle ? "h-7 w-7" : "h-9 w-9",
        className,
      ].join(" ")}
    >
      {avatarLabel(name)}
    </div>
  );
}

function useOutsideClose<T extends HTMLElement>(
  open: boolean,
  onClose: () => void,
  extraRefs: Array<React.RefObject<HTMLElement | null>> = []
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      const isInsidePrimary = ref.current?.contains(target);
      const isInsideExtra = extraRefs.some((extraRef) => extraRef.current?.contains(target));

      if (!isInsidePrimary && !isInsideExtra) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open, onClose, extraRefs]);

  return ref;
}

function IdentitySelectorSheet({
  open,
  onClose,
  value,
  onChange,
  realName,
  align = "right",
}: {
  open: boolean;
  onClose: () => void;
  value: CommentDisplayIdentityMode;
  onChange: (value: CommentDisplayIdentityMode) => void;
  realName: string;
  align?: "right" | "left";
}) {
  const mobileRef = useRef<HTMLDivElement | null>(null);
  const desktopRef = useOutsideClose<HTMLDivElement>(open, onClose, [mobileRef]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 md:hidden" onClick={onClose} aria-hidden="true" />
      <div
        ref={desktopRef}
        className={[
          "absolute bottom-full z-50 mb-2 hidden w-72 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2 shadow-[0_18px_50px_rgba(0,0,0,0.15)] dark:border-zinc-700 dark:bg-zinc-900 md:block",
          align === "left" ? "left-0" : "right-0",
        ].join(" ")}
      >
        <div className="px-2 pb-2 pt-1 text-right">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">اختر هوية النشر</p>
          <p className="text-xs text-zinc-600 dark:text-zinc-300">سيظهر التعليق أو الرد بالهوية المحددة.</p>
        </div>
        <div className="space-y-1">
          {DISPLAY_IDENTITY_OPTIONS.map((option) => {
            const optionName = getIdentityLabel(option.value, realName);
            const selected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  onClose();
                }}
                className={[
                  "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-right transition",
                  selected
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                    : "text-zinc-900 hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-800",
                ].join(" ")}
              >
                <AvatarBadge name={optionName} subtle={!selected} className="h-8 w-8" />
                <div className="min-w-0 flex-1">
                  <div className={selected ? "truncate text-sm font-semibold text-white dark:text-black" : "truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100"}>{optionName}</div>
                  <div className={selected ? "text-xs text-white/80 dark:text-black/70" : "text-xs text-zinc-700 dark:text-zinc-300"}>{option.subtitle}</div>
                </div>
                {selected ? <Check size={16} className="shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div
        ref={mobileRef}
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-[28px] bg-white p-4 shadow-[0_-10px_35px_rgba(0,0,0,0.18)] dark:bg-zinc-900 md:hidden"
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-zinc-200 dark:bg-zinc-700" />
        <div className="mb-3 text-right">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">اختر هوية النشر</p>
          <p className="text-xs text-zinc-600 dark:text-zinc-300">سيظهر التعليق أو الرد بالهوية المحددة.</p>
        </div>
        <div className="space-y-2">
          {DISPLAY_IDENTITY_OPTIONS.map((option) => {
            const optionName = getIdentityLabel(option.value, realName);
            const selected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  onClose();
                }}
                className={[
                  "flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-right transition",
                  selected
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black"
                    : "border-zinc-200 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100",
                ].join(" ")}
              >
                <AvatarBadge name={optionName} subtle={!selected} className="h-8 w-8" />
                <div className="min-w-0 flex-1">
                  <div className={selected ? "truncate text-sm font-semibold text-white dark:text-black" : "truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100"}>{optionName}</div>
                  <div className={selected ? "text-xs text-white/80 dark:text-black/70" : "text-xs text-zinc-700 dark:text-zinc-300"}>{option.subtitle}</div>
                </div>
                {selected ? <Check size={16} className="shrink-0" /> : null}
              </button>
            );
          })}
        </div>
        <button type="button" onClick={onClose} className="mt-3 w-full rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
          إغلاق
        </button>
      </div>
    </>
  );
}

function IdentityTrigger({
  value,
  realName,
  onClick,
  small = false,
}: {
  value: CommentDisplayIdentityMode;
  realName: string;
  onClick: () => void;
  small?: boolean;
}) {
  const label = getIdentityLabel(value, realName);

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-100/90 pr-1 pl-2 text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100",
        small ? "h-8" : "h-10",
      ].join(" ")}
      aria-label="تحديد هوية النشر"
    >
      <AvatarBadge name={label} subtle className={small ? "h-6 w-6 text-[10px]" : "h-7 w-7"} />
      <ChevronDown size={small ? 12 : 14} className="shrink-0" />
    </button>
  );
}

function FeedbackComposer({
  value,
  onChange,
  onSubmit,
  isSaving,
  currentUserName,
  identityMode,
  onIdentityModeChange,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => Promise<void>;
  isSaving: boolean;
  currentUserName: string;
  identityMode: CommentDisplayIdentityMode;
  onIdentityModeChange: (value: CommentDisplayIdentityMode) => void;
}) {
  const [isIdentityOpen, setIsIdentityOpen] = useState(false);

  return (
    <form
      className="rounded-[26px] border border-zinc-200/90 bg-white px-2.5 py-2 shadow-sm"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!value.trim()) return;
        await onSubmit();
      }}
    >
      <div className="flex items-center gap-2.5">
        <div className="relative shrink-0">
          <IdentityTrigger value={identityMode} realName={currentUserName} onClick={() => setIsIdentityOpen((prev) => !prev)} />
          <IdentitySelectorSheet
            open={isIdentityOpen}
            onClose={() => setIsIdentityOpen(false)}
            value={identityMode}
            onChange={onIdentityModeChange}
            realName={currentUserName}
          />
        </div>
        <label className="flex h-10 flex-1 items-center rounded-full bg-zinc-100 px-4 text-sm text-zinc-500">
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="أضف تعليق أو فيدباك"
            className="w-full bg-transparent text-right text-sm text-zinc-900 placeholder:text-zinc-500 outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={isSaving || !value.trim()}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white shadow-sm disabled:opacity-50"
          aria-label="إرسال الرأي"
        >
          <Send size={15} />
        </button>
      </div>
    </form>
  );
}

function CommentActionsMenu({
  open,
  onClose,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const ref = useOutsideClose<HTMLDivElement>(open, onClose);

  if (!open || (!canEdit && !canDelete)) return null;

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full z-40 mt-2 min-w-32 rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-[0_14px_40px_rgba(0,0,0,0.14)]"
    >
      {canEdit ? (
        <button
          type="button"
          onClick={() => {
            onEdit();
            onClose();
          }}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
        >
          <Pencil size={14} />
          <span>تعديل</span>
        </button>
      ) : null}
      {canDelete ? (
        <button
          type="button"
          onClick={() => {
            onDelete();
            onClose();
          }}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          <Trash2 size={14} />
          <span>حذف</span>
        </button>
      ) : null}
    </div>
  );
}

function ReplyComposer({
  value,
  onChange,
  onSubmit,
  onCancel,
  isSaving,
  identityMode,
  onIdentityModeChange,
  currentUserName,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
  identityMode: CommentDisplayIdentityMode;
  onIdentityModeChange: (value: CommentDisplayIdentityMode) => void;
  currentUserName: string;
}) {
  const [isIdentityOpen, setIsIdentityOpen] = useState(false);

  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="relative shrink-0">
        <IdentityTrigger
          value={identityMode}
          realName={currentUserName}
          small
          onClick={() => setIsIdentityOpen((prev) => !prev)}
        />
        <IdentitySelectorSheet
          open={isIdentityOpen}
          onClose={() => setIsIdentityOpen(false)}
          value={identityMode}
          onChange={onIdentityModeChange}
          realName={currentUserName}
        />
      </div>
      <label className="flex h-9 flex-1 items-center rounded-full bg-zinc-100 px-3 text-sm text-zinc-500">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="اكتب ردك"
          className="w-full bg-transparent text-right text-sm text-zinc-900 placeholder:text-zinc-500 outline-none"
        />
      </label>
      <button
        type="button"
        onClick={async () => onSubmit()}
        disabled={isSaving || !value.trim()}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-white disabled:opacity-50"
        aria-label="إرسال الرد"
      >
        <Send size={13} />
      </button>
      <button type="button" onClick={onCancel} className="text-xs font-medium text-zinc-600">
        إلغاء
      </button>
    </div>
  );
}

function CommentBody({
  item,
  visibleName,
  canEdit,
  canDelete,
  isReply,
  currentUserName,
  onReply,
  isReplying,
  replyValue,
  replyIdentityMode,
  onReplyValueChange,
  onReplyIdentityModeChange,
  onReplySubmit,
  onReplyCancel,
  onEditSubmit,
  onDelete,
  isSaving,
}: {
  item: WallpaperComment;
  visibleName: string;
  canEdit: boolean;
  canDelete: boolean;
  isReply: boolean;
  currentUserName: string;
  onReply?: () => void;
  isReplying?: boolean;
  replyValue?: string;
  replyIdentityMode?: CommentDisplayIdentityMode;
  onReplyValueChange?: (value: string) => void;
  onReplyIdentityModeChange?: (value: CommentDisplayIdentityMode) => void;
  onReplySubmit?: () => Promise<void>;
  onReplyCancel?: () => void;
  onEditSubmit: (content: string) => Promise<void>;
  onDelete: () => Promise<void>;
  isSaving: boolean;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.content);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openActions = () => {
    if (!canEdit && !canDelete) return;
    setIsMenuOpen(true);
  };

  const beginEditing = () => {
    setEditText(item.content);
    setIsEditing(true);
  };

  const startLongPress = () => {
    if (typeof window === "undefined" || window.innerWidth >= 768 || (!canEdit && !canDelete)) return;
    longPressTimer.current = setTimeout(() => {
      setIsMenuOpen(true);
    }, 450);
  };

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <div
      className="group relative py-0.5"
      onTouchStart={startLongPress}
      onTouchEnd={clearLongPress}
      onTouchCancel={clearLongPress}
      onMouseDown={startLongPress}
      onMouseUp={clearLongPress}
      onMouseLeave={clearLongPress}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
            <span className={isReply ? "font-semibold text-zinc-800" : "font-semibold text-zinc-900"}>{visibleName}</span>
            {isAdminAuthor(item) ? <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] text-white">Admin</span> : null}
            {formatTimestamp(item.createdAt) ? <span>{formatTimestamp(item.createdAt)}</span> : null}
            {wasEdited(item) ? <span>· تم التعديل</span> : null}
          </div>

          {isEditing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editText}
                onChange={(event) => setEditText(event.target.value)}
                rows={3}
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none"
              />
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={async () => {
                    if (!editText.trim()) return;
                    await onEditSubmit(editText);
                    setIsEditing(false);
                  }}
                  disabled={isSaving || !editText.trim()}
                  className="rounded-full bg-zinc-900 px-3 py-1.5 font-semibold text-white disabled:opacity-50"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditText(item.content);
                  }}
                  className="rounded-full bg-zinc-100 px-3 py-1.5 font-semibold text-zinc-700"
                >
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            <p
              className={[
                "mt-1 whitespace-pre-line break-words leading-6 text-zinc-700",
                isReply ? "text-[13px]" : "text-sm",
              ].join(" ")}
            >
              {item.content}
            </p>
          )}

          {!isEditing ? (
            <div className="mt-1.5 flex items-center gap-4 text-[11px] font-medium text-zinc-500">
              {onReply ? (
                <button type="button" onClick={onReply} className="hover:text-zinc-900">
                  رد
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {canEdit || canDelete ? (
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={openActions}
              className="hidden h-7 w-7 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900 md:inline-flex"
              aria-label="إجراءات التعليق"
            >
              <MoreHorizontal size={15} />
            </button>
            <button
              type="button"
              onClick={openActions}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 md:hidden"
              aria-label="إجراءات التعليق"
            >
              <MoreHorizontal size={15} />
            </button>
            <CommentActionsMenu
              open={isMenuOpen}
              onClose={() => setIsMenuOpen(false)}
              canEdit={canEdit}
              canDelete={canDelete}
              onEdit={beginEditing}
              onDelete={() => {
                void onDelete();
              }}
            />
          </div>
        ) : null}
      </div>

      {isReplying && replyValue !== undefined && replyIdentityMode && onReplyValueChange && onReplyIdentityModeChange && onReplySubmit && onReplyCancel ? (
        <ReplyComposer
          value={replyValue}
          onChange={onReplyValueChange}
          onSubmit={onReplySubmit}
          onCancel={onReplyCancel}
          isSaving={isSaving}
          identityMode={replyIdentityMode}
          onIdentityModeChange={onReplyIdentityModeChange}
          currentUserName={currentUserName}
        />
      ) : null}
    </div>
  );
}

type CommentNodeProps = {
  item: WallpaperComment;
  repliesByParent: Map<string, WallpaperComment[]>;
  descendantIdsByParent: Map<string, string[]>;
  depth?: number;
  activeReplyId: string | null;
  activeReplyText: string;
  activeReplyIdentityMode: CommentDisplayIdentityMode;
  currentUserId?: string;
  currentUserName: string;
  isAdmin: boolean;
  isSaving: boolean;
  canReply: boolean;
  onReplyToggle: (id: string) => void;
  onReplyTextChange: (value: string) => void;
  onReplyIdentityModeChange: (value: CommentDisplayIdentityMode) => void;
  onReplySubmit: (parentId: string, identityMode: CommentDisplayIdentityMode) => Promise<void>;
  onEditComment: (comment: WallpaperComment, content: string) => Promise<void>;
  onDeleteComment: (comment: WallpaperComment, replyIds?: string[]) => Promise<void>;
};

function CommentThreadNode({
  item,
  repliesByParent,
  descendantIdsByParent,
  depth = 0,
  activeReplyId,
  activeReplyText,
  activeReplyIdentityMode,
  currentUserId,
  currentUserName,
  isAdmin,
  isSaving,
  canReply,
  onReplyToggle,
  onReplyTextChange,
  onReplyIdentityModeChange,
  onReplySubmit,
  onEditComment,
  onDeleteComment,
}: CommentNodeProps) {
  const visibleName = getVisibleName(item);
  const itemId = item.id;
  const canEdit = currentUserId === item.userId;
  const canDelete = canEdit || isAdmin;
  const isReplying = activeReplyId === itemId;
  const childReplies = repliesByParent.get(itemId ?? "") ?? [];
  const isReply = depth > 0;
  const nestedRepliesClass =
    depth === 0
      ? "space-y-2 border-r border-zinc-200 pr-3 sm:pr-3"
      : "space-y-2 border-r border-zinc-200 pr-3 -mr-9 sm:mr-0 sm:pr-3";

  return (
    <article className={depth === 0 ? "py-2.5" : "py-2"}>
      <div className="flex items-start gap-2.5">
        <AvatarBadge
          name={visibleName}
          subtle={isReply}
          className={isReply ? "mt-0.5 h-7 w-7 text-[10px]" : "mt-0.5"}
        />
        <div className="min-w-0 flex-1 space-y-2">
          <CommentBody
            item={item}
            visibleName={visibleName}
            canEdit={canEdit}
            canDelete={canDelete}
            isReply={isReply}
            currentUserName={currentUserName}
            onReply={canReply && itemId ? () => onReplyToggle(itemId) : undefined}
            isReplying={isReplying}
            replyValue={activeReplyText}
            replyIdentityMode={activeReplyIdentityMode}
            onReplyValueChange={onReplyTextChange}
            onReplyIdentityModeChange={onReplyIdentityModeChange}
            onReplySubmit={itemId ? () => onReplySubmit(itemId, activeReplyIdentityMode) : undefined}
            onReplyCancel={itemId ? () => onReplyToggle(itemId) : undefined}
            onEditSubmit={(content) => onEditComment(item, content)}
            onDelete={() => onDeleteComment(item, descendantIdsByParent.get(itemId ?? "") ?? [])}
            isSaving={isSaving}
          />

          {childReplies.length > 0 ? (
            <div className={nestedRepliesClass}>
              {childReplies.map((reply) => (
                <CommentThreadNode
                  key={reply.id}
                  item={reply}
                  repliesByParent={repliesByParent}
                  descendantIdsByParent={descendantIdsByParent}
                  depth={depth + 1}
                  activeReplyId={activeReplyId}
                  activeReplyText={activeReplyText}
                  activeReplyIdentityMode={activeReplyIdentityMode}
                  currentUserId={currentUserId}
                  currentUserName={currentUserName}
                  isAdmin={isAdmin}
                  isSaving={isSaving}
                  canReply={canReply}
                  onReplyToggle={onReplyToggle}
                  onReplyTextChange={onReplyTextChange}
                  onReplyIdentityModeChange={onReplyIdentityModeChange}
                  onReplySubmit={onReplySubmit}
                  onEditComment={onEditComment}
                  onDeleteComment={onDeleteComment}
                />
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
  currentUserId,
  currentUserName,
  isAdmin,
  onLogin,
  onSubmitFeedback,
  onSubmitReply,
  onEditComment,
  onDeleteComment,
  isSaving,
}: {
  comments: WallpaperComment[];
  isSignedIn: boolean;
  currentUserId?: string;
  currentUserName: string;
  isAdmin: boolean;
  onLogin: () => void;
  onSubmitFeedback: (value: string, identityMode: CommentDisplayIdentityMode) => Promise<void>;
  onSubmitReply: (parentId: string, value: string, identityMode: CommentDisplayIdentityMode) => Promise<void>;
  onEditComment: (comment: WallpaperComment, value: string) => Promise<void>;
  onDeleteComment: (comment: WallpaperComment, replyIds?: string[]) => Promise<void>;
  isSaving: boolean;
}) {
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackIdentityMode, setFeedbackIdentityMode] = useState<CommentDisplayIdentityMode>("real");
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [activeReplyText, setActiveReplyText] = useState("");
  const [replyIdentityMode, setReplyIdentityMode] = useState<CommentDisplayIdentityMode>("real");

  const rootComments = useMemo(() => comments.filter((item) => !item.parentId), [comments]);
  const repliesByParent = useMemo(() => {
    const map = new Map<string, WallpaperComment[]>();
    comments
      .filter((item) => item.parentId)
      .forEach((item) => {
        const key = item.parentId as string;
        map.set(key, [...(map.get(key) ?? []), item]);
      });
    return map;
  }, [comments]);
  const descendantIdsByParent = useMemo(() => {
    const map = new Map<string, string[]>();

    const collect = (parentId: string): string[] => {
      const children = repliesByParent.get(parentId) ?? [];
      const descendants = children.flatMap((child) => {
        const childId = child.id ? [child.id] : [];
        const nestedIds = child.id ? collect(child.id) : [];
        return [...childId, ...nestedIds];
      });
      map.set(parentId, descendants);
      return descendants;
    };

    rootComments.forEach((comment) => {
      if (comment.id) {
        collect(comment.id);
      }
    });

    return map;
  }, [repliesByParent, rootComments]);

  return (
    <section id="comments" className="space-y-3.5 [direction:rtl]">
      <div className="flex items-center gap-2 text-zinc-900">
        <MessageCircleMore size={18} className="text-zinc-500" />
        <h2 className="text-base font-bold">تعليقات</h2>
      </div>

      {isSignedIn ? (
        <FeedbackComposer
          value={feedbackText}
          onChange={setFeedbackText}
          onSubmit={async () => {
            await onSubmitFeedback(feedbackText, feedbackIdentityMode);
            setFeedbackText("");
            setFeedbackIdentityMode("real");
          }}
          isSaving={isSaving}
          currentUserName={currentUserName}
          identityMode={feedbackIdentityMode}
          onIdentityModeChange={setFeedbackIdentityMode}
        />
      ) : (
        <div className="rounded-[26px] border border-zinc-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
              <UserRound size={18} />
            </div>
            <div className="flex-1 text-sm text-zinc-700">سجّل الدخول لإضافة رأيك أو الرد على الآخرين.</div>
            <button
              type="button"
              onClick={onLogin}
              className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white"
            >
              تسجيل الدخول
            </button>
          </div>
        </div>
      )}

      <div className="space-y-0.5">
        {rootComments.length === 0 ? (
          <div className="rounded-[26px] border border-dashed border-zinc-200 bg-white px-4 py-6 text-center text-sm text-zinc-600 shadow-sm">
            لا توجد تعليقات حتى الآن.
          </div>
        ) : (
          rootComments.map((comment) => (
            <CommentThreadNode
              key={comment.id}
              item={comment}
              repliesByParent={repliesByParent}
              descendantIdsByParent={descendantIdsByParent}
              activeReplyId={activeReplyId}
              activeReplyText={activeReplyText}
              activeReplyIdentityMode={replyIdentityMode}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              isAdmin={isAdmin}
              isSaving={isSaving}
              canReply={isSignedIn}
              onReplyToggle={(id) => {
                if (activeReplyId === id) {
                  setActiveReplyId(null);
                  setActiveReplyText("");
                  setReplyIdentityMode("real");
                  return;
                }
                setActiveReplyId(id);
                setActiveReplyText("");
                setReplyIdentityMode("real");
              }}
              onReplyTextChange={setActiveReplyText}
              onReplyIdentityModeChange={setReplyIdentityMode}
              onReplySubmit={async (parentId, identityMode) => {
                if (!activeReplyText.trim()) return;
                await onSubmitReply(parentId, activeReplyText, identityMode);
                setActiveReplyText("");
                setActiveReplyId(null);
                setReplyIdentityMode("real");
              }}
              onEditComment={onEditComment}
              onDeleteComment={onDeleteComment}
            />
          ))
        )}
      </div>
    </section>
  );
}
