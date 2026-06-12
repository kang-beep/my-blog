import { useRef, type ChangeEvent, type ReactNode } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Underline,
} from "lucide-react";

interface EditorToolbarProps {
  editor: Editor | null;
  onInsertImage: (file: File) => Promise<void>;
  isUploading: boolean;
}

export default function EditorToolbar({ editor, onInsertImage, isUploading }: EditorToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImageActive = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => currentEditor?.isActive("image") ?? false,
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

  const handleImagePick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    await onInsertImage(file);
  };

  return (
    <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 p-2">
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
      <ToolbarButton
        label="이미지 삽입"
        isActive={false}
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
      >
        <ImagePlus size={16} aria-hidden />
      </ToolbarButton>
      {isImageActive ? (
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
