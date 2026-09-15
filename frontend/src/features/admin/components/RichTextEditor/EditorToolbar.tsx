import { useRef, type ChangeEvent, type ReactNode } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Table,
  Trash2,
  Underline,
} from "lucide-react";
import { EDITOR_FONT_SIZE_OPTIONS } from "@/features/admin/components/RichTextEditor/fontSizeOptions";
import {
  EDITOR_TEXT_COLOR_PRESETS,
  TABLE_CELL_BG_PRESETS,
} from "@/features/admin/components/RichTextEditor/colorPresets";
import ColorPickerDropdown from "@/features/admin/components/RichTextEditor/ColorPickerDropdown";
import type { TableCellVerticalAlign } from "@/features/admin/components/RichTextEditor/editorTableCells";
import { canDeleteSelectedTableRange } from "@/features/admin/components/RichTextEditor/tableSelectionDelete";

interface EditorToolbarProps {
  editor: Editor | null;
  onInsertImage: (file: File) => Promise<void>;
  isUploading: boolean;
  defaultTableRows: number;
  defaultTableCols: number;
}

export default function EditorToolbar({
  editor,
  onInsertImage,
  isUploading,
  defaultTableRows,
  defaultTableCols,
}: EditorToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editorState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      isImageActive: currentEditor?.isActive("image") ?? false,
      isTableActive: currentEditor?.isActive("table") ?? false,
      canDeleteSelection: currentEditor
        ? canDeleteSelectedTableRange(currentEditor.state)
        : false,
      canMergeCells: currentEditor?.can().mergeCells() ?? false,
      canSplitCell: currentEditor?.can().splitCell() ?? false,
      textAlign: (currentEditor?.getAttributes("paragraph").textAlign ||
        currentEditor?.getAttributes("heading").textAlign ||
        "left") as string,
      fontSize: (currentEditor?.getAttributes("textStyle").fontSize as string | undefined) ?? "",
      textColor: (currentEditor?.getAttributes("textStyle").color as string | undefined) ?? "",
      cellBackgroundColor:
        (currentEditor?.getAttributes("tableCell").backgroundColor as string | undefined) ||
        (currentEditor?.getAttributes("tableHeader").backgroundColor as string | undefined) ||
        "",
      cellVerticalAlign:
        (currentEditor?.getAttributes("tableCell").verticalAlign as
          | TableCellVerticalAlign
          | null
          | undefined) ||
        (currentEditor?.getAttributes("tableHeader").verticalAlign as
          | TableCellVerticalAlign
          | null
          | undefined) ||
        null,
    }),
  });

  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("링크 URL을 입력하세요", previousUrl ?? "https://");

    if (url === null) {
      return;
    }

    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const setImageWidth = (width: string | null) => {
    editor.chain().focus().updateAttributes("image", { width, height: null }).run();
  };

  const insertTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: defaultTableRows, cols: defaultTableCols, withHeaderRow: true })
      .run();
  };

  const setFontSize = (value: string) => {
    if (value === "") {
      editor.chain().focus().unsetFontSize().run();
      return;
    }
    editor.chain().focus().setFontSize(value).run();
  };

  const setTextColor = (value: string) => {
    if (value === "") {
      editor.chain().focus().unsetColor().run();
      return;
    }
    editor.chain().focus().setColor(value).run();
  };

  const setCellBackgroundColor = (value: string) => {
    editor
      .chain()
      .focus()
      .setCellAttribute("backgroundColor", value === "" ? null : value)
      .run();
  };

  const setCellVerticalAlign = (value: TableCellVerticalAlign) => {
    editor.chain().focus().setCellAttribute("verticalAlign", value).run();
  };

  const handleImagePick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    await onInsertImage(file);
  };

  return (
    <div className="sticky -top-5 z-30 flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50/95 p-2 shadow-sm backdrop-blur-sm lg:-top-6">
      <ToolbarButton
        label="굵게"
        isActive={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold size={16} aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        label="기울임"
        isActive={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic size={16} aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        label="밑줄"
        isActive={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Underline size={16} aria-hidden />
      </ToolbarButton>
      <label className="inline-flex h-8 items-center gap-1 rounded-md border border-transparent px-1 text-xs text-slate-600 hover:border-slate-200 hover:bg-white">
        <span className="sr-only">글자 크기</span>
        <select
          className="h-7 min-w-[8.5rem] max-w-[11rem] bg-transparent text-xs text-slate-700 outline-none"
          aria-label="글자 크기"
          title="글자 크기"
          value={editorState?.fontSize ?? ""}
          onChange={(event) => setFontSize(event.target.value)}
        >
          {EDITOR_FONT_SIZE_OPTIONS.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <ColorPickerDropdown
        name="글자색"
        colors={EDITOR_TEXT_COLOR_PRESETS}
        activeValue={editorState?.textColor ?? ""}
        emptySwatchLabel="기본"
        onSelect={setTextColor}
      />
      <ToolbarButton
        label="제목 2"
        isActive={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 size={16} aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        label="제목 3"
        isActive={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 size={16} aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        label="왼쪽 정렬"
        isActive={editorState?.textAlign === "left"}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      >
        <AlignLeft size={16} aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        label="가운데 정렬"
        isActive={editorState?.textAlign === "center"}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      >
        <AlignCenter size={16} aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        label="오른쪽 정렬"
        isActive={editorState?.textAlign === "right"}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      >
        <AlignRight size={16} aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        label="양쪽 정렬"
        isActive={editorState?.textAlign === "justify"}
        onClick={() => editor.chain().focus().setTextAlign("justify").run()}
      >
        <AlignJustify size={16} aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        label="글머리 목록"
        isActive={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List size={16} aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        label="번호 목록"
        isActive={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered size={16} aria-hidden />
      </ToolbarButton>
      <ToolbarButton label="링크" isActive={editor.isActive("link")} onClick={setLink}>
        <Link2 size={16} aria-hidden />
      </ToolbarButton>
      <ToolbarButton label="표 삽입" isActive={editorState?.isTableActive ?? false} onClick={insertTable}>
        <Table size={16} aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        label="이미지 삽입"
        isActive={false}
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
      >
        <ImagePlus size={16} aria-hidden />
      </ToolbarButton>
      {editorState?.isTableActive ? (
        <>
          <span className="mx-1 hidden h-6 w-px bg-slate-200 sm:inline" aria-hidden />
          <ToolbarTextButton label="행 추가" onClick={() => editor.chain().focus().addRowAfter().run()}>
            +행
          </ToolbarTextButton>
          <ToolbarTextButton label="열 추가" onClick={() => editor.chain().focus().addColumnAfter().run()}>
            +열
          </ToolbarTextButton>
          <ToolbarTextButton label="행 삭제" onClick={() => editor.chain().focus().deleteRow().run()}>
            -행
          </ToolbarTextButton>
          <ToolbarTextButton label="열 삭제" onClick={() => editor.chain().focus().deleteColumn().run()}>
            -열
          </ToolbarTextButton>
          <ColorPickerDropdown
            name="셀배경"
            colors={TABLE_CELL_BG_PRESETS}
            activeValue={editorState?.cellBackgroundColor ?? ""}
            emptySwatchLabel="없음"
            onSelect={setCellBackgroundColor}
          />
          <ToolbarButton
            label="셀 상단 정렬"
            isActive={editorState?.cellVerticalAlign === "top"}
            onClick={() => setCellVerticalAlign("top")}
          >
            <AlignVerticalJustifyStart size={16} aria-hidden />
          </ToolbarButton>
          <ToolbarButton
            label="셀 세로 가운데 정렬"
            isActive={editorState?.cellVerticalAlign === "middle"}
            onClick={() => setCellVerticalAlign("middle")}
          >
            <AlignVerticalJustifyCenter size={16} aria-hidden />
          </ToolbarButton>
          <ToolbarButton
            label="셀 하단 정렬"
            isActive={editorState?.cellVerticalAlign === "bottom"}
            onClick={() => setCellVerticalAlign("bottom")}
          >
            <AlignVerticalJustifyEnd size={16} aria-hidden />
          </ToolbarButton>
          {editorState.canMergeCells ? (
            <ToolbarTextButton
              label="선택 셀 합치기"
              onClick={() => editor.chain().focus().mergeCells().run()}
            >
              합치기
            </ToolbarTextButton>
          ) : null}
          {editorState.canSplitCell ? (
            <ToolbarTextButton
              label="셀 나누기"
              onClick={() => editor.chain().focus().splitCell().run()}
            >
              나누기
            </ToolbarTextButton>
          ) : null}
          {editorState.canDeleteSelection ? (
            <ToolbarButton
              label="선택 범위 행/열 삭제"
              isActive={false}
              onClick={() => editor.chain().focus().deleteSelectedTableRange().run()}
            >
              <Trash2 size={16} aria-hidden />
            </ToolbarButton>
          ) : null}
          <ToolbarTextButton label="표 삭제" onClick={() => editor.chain().focus().deleteTable().run()}>
            표삭제
          </ToolbarTextButton>
        </>
      ) : null}
      {editorState?.isImageActive ? (
        <>
          <span className="mx-1 hidden h-6 w-px bg-slate-200 sm:inline" aria-hidden />
          <span className="self-center px-1 text-xs text-slate-500">이미지 크기</span>
          <ToolbarTextButton label="이미지 너비 50%" onClick={() => setImageWidth("50%")}>
            50%
          </ToolbarTextButton>
          <ToolbarTextButton label="이미지 너비 75%" onClick={() => setImageWidth("75%")}>
            75%
          </ToolbarTextButton>
          <ToolbarTextButton label="이미지 너비 100%" onClick={() => setImageWidth("100%")}>
            100%
          </ToolbarTextButton>
          <ToolbarTextButton label="이미지 원본 크기" onClick={() => setImageWidth(null)}>
            원본
          </ToolbarTextButton>
        </>
      ) : null}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => void handleImagePick(event)}
      />
    </div>
  );
}

interface ToolbarButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}

function ToolbarButton({ label, isActive, onClick, disabled, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md border text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 ${
        isActive ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-transparent"
      }`}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

interface ToolbarTextButtonProps {
  label: string;
  onClick: () => void;
  children: ReactNode;
}

function ToolbarTextButton({ label, onClick, children }: ToolbarTextButtonProps) {
  return (
    <button
      type="button"
      className="inline-flex h-8 items-center rounded-md border border-transparent px-2 text-xs font-medium text-slate-700 hover:border-slate-200 hover:bg-white"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
