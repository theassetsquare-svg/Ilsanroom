import { useRef, useState, useCallback, useEffect } from 'react';
import { uploadPostImage } from '@/lib/community-api';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

const TOOLBAR_BUTTONS = [
  { cmd: 'bold', icon: 'B', title: '굵게', style: 'font-bold' },
  { cmd: 'italic', icon: 'I', title: '기울임', style: 'italic' },
  { cmd: 'underline', icon: 'U', title: '밑줄', style: 'underline' },
  { cmd: 'strikeThrough', icon: 'S', title: '취소선', style: 'line-through' },
];

const HEADING_OPTIONS = [
  { value: '', label: '본문' },
  { value: 'h2', label: '제목 1' },
  { value: 'h3', label: '제목 2' },
  { value: 'h4', label: '제목 3' },
];

export default function RichTextEditor({ value, onChange, placeholder = '내용을 입력하세요...', minHeight = 300 }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const composingRef = useRef(false);
  const initializedRef = useRef(false);
  const [isEmpty, setIsEmpty] = useState(!value);

  // 초기값 한 번만 세팅 (dangerouslySetInnerHTML 대신)
  useEffect(() => {
    if (editorRef.current && !initializedRef.current) {
      editorRef.current.innerHTML = value || '';
      initializedRef.current = true;
      setIsEmpty(!value);
    }
  }, [value]);

  const syncContent = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const text = editorRef.current.textContent || '';
      setIsEmpty(!text.trim() && !html.includes('<img') && !html.includes('<video'));
      onChange(html);
    }
  }, [onChange]);

  const exec = useCallback((cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    syncContent();
  }, [syncContent]);

  // 한글 IME 조합 중에는 onChange 호출하지 않음
  const handleInput = useCallback(() => {
    if (composingRef.current) return;
    syncContent();
  }, [syncContent]);

  const handleCompositionStart = useCallback(() => {
    composingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(() => {
    composingRef.current = false;
    syncContent();
  }, [syncContent]);

  const handleHeading = useCallback((tag: string) => {
    if (tag) {
      exec('formatBlock', `<${tag}>`);
    } else {
      exec('formatBlock', '<p>');
    }
  }, [exec]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 10 * 1024 * 1024) return;

    setUploading(true);
    const { url, error } = await uploadPostImage(file);
    if (url && !error) {
      exec('insertHTML', `<div style="margin:12px 0"><img src="${url}" alt="업로드 이미지" style="max-width:100%;border-radius:8px" /></div>`);
    }
    setUploading(false);
    e.target.value = '';
  }, [exec]);

  const handleVideoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) return;
    if (file.size > 50 * 1024 * 1024) return;

    setUploading(true);
    const { url, error } = await uploadPostImage(file);
    if (url && !error) {
      exec('insertHTML', `<div style="margin:12px 0"><video src="${url}" controls playsinline style="max-width:100%;border-radius:8px"></video></div>`);
    }
    setUploading(false);
    e.target.value = '';
  }, [exec]);

  const handleLink = useCallback(() => {
    const url = prompt('링크 URL을 입력하세요:');
    if (url) {
      exec('createLink', url);
    }
  }, [exec]);

  const handleYoutube = useCallback(() => {
    const url = prompt('YouTube 링크를 붙여넣으세요:');
    if (!url) return;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
    if (match) {
      const videoId = match[1];
      exec('insertHTML', `<div style="margin:12px 0;position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px"><iframe src="https://www.youtube.com/embed/${videoId}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allowfullscreen></iframe></div>`);
    }
  }, [exec]);

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b" style={{ borderColor: '#E5E7EB', backgroundColor: '#FAFAFA' }}>
        <select
          onChange={(e) => handleHeading(e.target.value)}
          className="rounded-lg border px-2 py-1.5 text-xs outline-none"
          style={{ borderColor: '#D1D5DB', color: '#333', minHeight: 32 }}
        >
          {HEADING_OPTIONS.map(h => (
            <option key={h.value} value={h.value}>{h.label}</option>
          ))}
        </select>

        <div className="w-px h-5 mx-1" style={{ backgroundColor: '#E5E7EB' }} />

        {TOOLBAR_BUTTONS.map(btn => (
          <button
            key={btn.cmd}
            onClick={() => exec(btn.cmd)}
            title={btn.title}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sm transition hover:bg-gray-200"
            style={{ color: '#333' }}
          >
            <span className={btn.style}>{btn.icon}</span>
          </button>
        ))}

        <div className="w-px h-5 mx-1" style={{ backgroundColor: '#E5E7EB' }} />

        <button onClick={() => exec('insertUnorderedList')} title="목록" className="flex h-8 w-8 items-center justify-center rounded-lg text-sm transition hover:bg-gray-200" style={{ color: '#333' }}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <button onClick={() => exec('insertOrderedList')} title="번호 목록" className="flex h-8 w-8 items-center justify-center rounded-lg text-sm transition hover:bg-gray-200" style={{ color: '#333' }}>
          <span className="text-xs font-bold">1.</span>
        </button>

        <button onClick={() => exec('formatBlock', '<blockquote>')} title="인용" className="flex h-8 w-8 items-center justify-center rounded-lg text-sm transition hover:bg-gray-200" style={{ color: '#333' }}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        </button>

        <div className="w-px h-5 mx-1" style={{ backgroundColor: '#E5E7EB' }} />

        <button onClick={handleLink} title="링크" className="flex h-8 w-8 items-center justify-center rounded-lg text-sm transition hover:bg-gray-200" style={{ color: '#333' }}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
        </button>

        <button onClick={() => fileInputRef.current?.click()} title="이미지" disabled={uploading} className="flex h-8 w-8 items-center justify-center rounded-lg text-sm transition hover:bg-gray-200 disabled:opacity-40" style={{ color: '#333' }}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </button>

        <button onClick={() => videoInputRef.current?.click()} title="동영상" disabled={uploading} className="flex h-8 w-8 items-center justify-center rounded-lg text-sm transition hover:bg-gray-200 disabled:opacity-40" style={{ color: '#333' }}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
        </button>

        <button onClick={handleYoutube} title="YouTube" className="flex h-8 w-8 items-center justify-center rounded-lg text-sm transition hover:bg-gray-200" style={{ color: '#FF0000' }}>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
        </button>

        {uploading && <span className="text-xs ml-2" style={{ color: '#8B5CF6' }}>업로드 중...</span>}
      </div>

      {/* Editor area — contentEditable, ref 기반 초기화 (dangerouslySetInnerHTML 제거) */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          className="rich-editor px-4 py-3 text-sm outline-none"
          style={{
            minHeight,
            color: '#111',
            lineHeight: '1.8',
          }}
        />
        {/* placeholder overlay */}
        {isEmpty && (
          <div
            className="absolute top-0 left-0 px-4 py-3 text-sm pointer-events-none"
            style={{ color: '#999', lineHeight: '1.8' }}
          >
            {placeholder}
          </div>
        )}
      </div>

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
    </div>
  );
}
