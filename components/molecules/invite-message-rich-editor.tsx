"use client";

import { useCallback } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  INVITE_LINK_PLACEHOLDER,
  DEFAULT_INVITE_MESSAGE_HTML,
} from "@/lib/invite-email-html";

export type InviteMessageRichEditorProps = {
  initialHtml: string;
  onHtmlChange: (html: string) => void;
  className?: string;
};

export function InviteMessageRichEditor({
  initialHtml,
  onHtmlChange,
  className,
}: InviteMessageRichEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: false,
        HTMLAttributes: {
          class: "font-medium text-brand underline underline-offset-2",
        },
        validate: (href) =>
          Boolean(href) &&
          (href === INVITE_LINK_PLACEHOLDER ||
            /^https?:\/\//i.test(href) ||
            href.startsWith("mailto:")),
      }),
      Placeholder.configure({
        placeholder: "Écrivez votre message…",
      }),
    ],
    content: initialHtml || DEFAULT_INVITE_MESSAGE_HTML,
    editorProps: {
      attributes: {
        class: cn(
          "min-h-[10rem] max-w-none rounded-md border border-input bg-transparent px-3 py-2.5 text-sm leading-relaxed outline-none",
          "focus-visible:ring-2 focus-visible:ring-brand/25",
          "[&_.ProseMirror]:min-h-[10rem] [&_.ProseMirror]:outline-none",
          "[&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5",
          className,
        ),
      },
    },
    onUpdate: ({ editor: ed }) => {
      onHtmlChange(ed.getHTML());
    },
  });

  const insertInvitationLink = useCallback(() => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertContent(
        `<a href="${INVITE_LINK_PLACEHOLDER}">Inscris-toi pour démarrer</a>`,
      )
      .run();
  }, [editor]);

  if (!editor) {
    return (
      <div
        className={cn(
          "min-h-[10rem] rounded-md border border-input bg-muted/30 animate-pulse",
          className,
        )}
        aria-hidden
      />
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        <Button
          type="button"
          variant={editor.isActive("bold") ? "secondary" : "ghost"}
          size="sm"
          className="h-8 px-2"
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-pressed={editor.isActive("bold")}
          aria-label="Gras"
        >
          <Bold className="size-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("italic") ? "secondary" : "ghost"}
          size="sm"
          className="h-8 px-2"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-pressed={editor.isActive("italic")}
          aria-label="Italique"
        >
          <Italic className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1 px-2"
          onClick={insertInvitationLink}
          aria-label="Insérer le lien d’inscription avec jeton"
        >
          <Link2 className="size-4" />
          <span className="text-xs font-medium">Lien d’inscription</span>
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
