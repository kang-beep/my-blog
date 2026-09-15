import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { TableRow } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyleKit } from "@tiptap/extension-text-style";
import EditorToolbar from "@/features/admin/components/RichTextEditor/EditorToolbar";
import TableContextMenu from "@/features/admin/components/RichTextEditor/TableContextMenu";
import { EditorTable } from "@/features/admin/components/RichTextEditor/editorTable";
import {
  EditorTableCell,
  EditorTableHeader,
} from "@/features/admin/components/RichTextEditor/editorTableCells";
import { TableBlockMove } from "@/features/admin/components/RichTextEditor/tableBlockMove";
import { TableSeResize } from "@/features/admin/components/RichTextEditor/tableSeResize";
import { TableSelectionDelete } from "@/features/admin/components/RichTextEditor/tableSelectionDelete";
import {
  DEFAULT_TABLE_COLS,
  DEFAULT_TABLE_ROWS,
} from "@/features/admin/components/RichTextEditor/tableConstants";
import type { RichTextEditorProps } from "@/features/admin/components/RichTextEditor/types";
import { uploadEditorImage } from "@/shared/lib/uploadEditorImage";
import "@/features/admin/components/RichTextEditor/editor.css";

export default function RichTextEditor({
  value,
  onChange,
  postId,
  disabled = false,
  placeholder = "본문을 입력하세요. 이미지는 붙여넣기(Ctrl+V), 드래그 앤 드롭, 툴바 버튼으로 삽입할 수 있습니다.",
}: RichTextEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const editorRef = useRef<Editor | null>(null);
  const postIdRef = useRef(postId);
  const lastEmittedHtmlRef = useRef<string>(value || "");
  const onChangeRef = useRef(onChange);

  postIdRef.current = postId;
  onChangeRef.current = onChange;

  const insertImageFile = useCallback(async (file: File) => {
    const currentEditor = editorRef.current;
    const currentPostId = postIdRef.current;

    if (!currentEditor) {
      return;
    }

    if (!currentPostId) {
      setUploadError("글 ID가 없어 이미지를 업로드할 수 없습니다.");
      return;
    }

    setIsUploading(true);
    setUploadError("");

    try {
      const url = await uploadEditorImage(file, currentPostId);
      currentEditor.chain().focus().setImage({ src: url, alt: file.name }).run();
    } catch (error) {
      const message = error instanceof Error ? error.message : "이미지 업로드에 실패했습니다.";
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const insertImageRef = useRef(insertImageFile);
  insertImageRef.current = insertImageFile;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          HTMLAttributes: {
            rel: "noopener noreferrer",
            target: "_blank",
          },
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: false,
        resize: {
          enabled: true,
          directions: ["bottom-right"],
          minWidth: 80,
          minHeight: 60,
          alwaysPreserveAspectRatio: true,
        },
      }),
      TableRow,
      EditorTableHeader,
      EditorTableCell,
      EditorTable,
      TextStyleKit.configure({
        backgroundColor: false,
        color: {},
        fontFamily: false,
        lineHeight: false,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
      }),
      TableSeResize,
      TableBlockMove,
      TableSelectionDelete,
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editable: !disabled,
    shouldRerenderOnTransaction: false,
    onUpdate: ({ editor: currentEditor }) => {
      const html = currentEditor.getHTML();
      lastEmittedHtmlRef.current = html;
      onChangeRef.current(html);
    },
    editorProps: {
      handlePaste: (_view, event) => {
        const clipboardItems = event.clipboardData?.items;
        if (!clipboardItems) {
          return false;
        }

        const imageItem = Array.from(clipboardItems).find((item) => item.type.startsWith("image/"));
        if (!imageItem) {
          return false;
        }

        const file = imageItem.getAsFile();
        if (!file) {
          return false;
        }

        event.preventDefault();
        void insertImageRef.current(file);
        return true;
      },
      handleDrop: (_view, event) => {
        const transfer = event.dataTransfer;
        if (!transfer?.files.length) {
          return false;
        }

        const imageFile = Array.from(transfer.files).find((item) => item.type.startsWith("image/"));
        if (!imageFile) {
          return false;
        }

        event.preventDefault();
        void insertImageRef.current(imageFile);
        return true;
      },
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      return;
    }

    const nextContent = value || "";
    if (nextContent === lastEmittedHtmlRef.current) {
      return;
    }
    if (nextContent === editor.getHTML()) {
      lastEmittedHtmlRef.current = nextContent;
      return;
    }

    editor.commands.setContent(nextContent, { emitUpdate: false });
    lastEmittedHtmlRef.current = editor.getHTML();
  }, [editor, value]);

  return (
    <div className="rich-text-editor overflow-visible rounded-lg border border-slate-300 bg-white">
      <EditorToolbar
        editor={editor}
        onInsertImage={insertImageFile}
        isUploading={isUploading}
        defaultTableRows={DEFAULT_TABLE_ROWS}
        defaultTableCols={DEFAULT_TABLE_COLS}
      />
      <EditorContent editor={editor} />
      {editor ? <TableContextMenu editor={editor} /> : null}
      {isUploading ? <p className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">이미지 업로드 중...</p> : null}
      {uploadError ? <p className="border-t border-slate-100 px-3 py-2 text-xs text-rose-600">{uploadError}</p> : null}
    </div>
  );
}

export function isEditorContentEmpty(html: string): boolean {
  const stripped = html
    .replace(/<p><br><\/p>/gi, "")
    .replace(/<p>\s*<\/p>/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim();
  return stripped.length === 0;
}
