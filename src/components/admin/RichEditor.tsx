import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const btn = 'rounded px-2 py-1 text-xs hover:bg-neon-bg disabled:opacity-40';
const btnActive = 'bg-neon-primary/20 text-neon-primary-light';

export default function RichEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[400px] p-4 focus:outline-none rich-content',
      },
    },
  });

  // 외부 value 변경 시 동기화 (편집 중이 아닐 때)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="rounded-lg border border-neon-border bg-neon-bg">
      <div className="flex flex-wrap gap-1 border-b border-neon-border px-2 py-1.5">
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`${btn} ${editor.isActive('heading', { level: 2 }) ? btnActive : ''}`}>H2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`${btn} ${editor.isActive('heading', { level: 3 }) ? btnActive : ''}`}>H3</button>
        <button type="button" onClick={() => editor.chain().focus().setParagraph().run()} className={`${btn} ${editor.isActive('paragraph') ? btnActive : ''}`}>P</button>
        <span className="mx-1 w-px bg-neon-border" />
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`${btn} font-bold ${editor.isActive('bold') ? btnActive : ''}`}>B</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`${btn} italic ${editor.isActive('italic') ? btnActive : ''}`}>I</button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={`${btn} line-through ${editor.isActive('strike') ? btnActive : ''}`}>S</button>
        <span className="mx-1 w-px bg-neon-border" />
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`${btn} ${editor.isActive('bulletList') ? btnActive : ''}`}>• 목록</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`${btn} ${editor.isActive('orderedList') ? btnActive : ''}`}>1. 목록</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`${btn} ${editor.isActive('blockquote') ? btnActive : ''}`}>" 인용</button>
        <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={`${btn} font-mono ${editor.isActive('codeBlock') ? btnActive : ''}`}>{'</>'}</button>
        <span className="mx-1 w-px bg-neon-border" />
        <button type="button" onClick={() => {
          const url = prompt('링크 URL');
          if (!url) return;
          editor.chain().focus().setHardBreak().run();
        }} className={btn}>↵</button>
        <button type="button" onClick={() => editor.chain().focus().undo().run()} className={btn} disabled={!editor.can().undo()}>↶</button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} className={btn} disabled={!editor.can().redo()}>↷</button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
