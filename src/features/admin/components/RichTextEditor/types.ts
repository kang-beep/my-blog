export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  postId: string;
  disabled?: boolean;
  placeholder?: string;
}

export type ImageInsertHandler = (file: File) => Promise<void>;
