import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Bold, Italic, Underline, List, ListOrdered, 
  Heading1, Heading2, Link, Image, AlignLeft, 
  AlignCenter, AlignRight, Quote, Code, Undo, Redo
} from 'lucide-react';

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Nhập nội dung...",
  minHeight = "300px"
}) {
  const editorRef = useRef(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const execCommand = useCallback((command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  }, [handleInput]);

  const insertLink = () => {
    if (linkUrl) {
      execCommand('createLink', linkUrl);
      setLinkUrl('');
      setShowLinkInput(false);
    }
  };

  const insertImage = () => {
    const url = prompt('Nhập URL ảnh:');
    if (url) {
      execCommand('insertImage', url);
    }
  };

  const ToolbarButton = ({ icon: Icon, command, value, title, active }) => (
    <button
      type="button"
      onClick={() => execCommand(command, value)}
      className={`p-2 rounded hover:bg-slate-100 transition-colors ${active ? 'bg-slate-200' : ''}`}
      title={title}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-slate-50">
        {/* History */}
        <ToolbarButton icon={Undo} command="undo" title="Hoàn tác" />
        <ToolbarButton icon={Redo} command="redo" title="Làm lại" />
        
        <div className="w-px h-6 bg-slate-300 mx-1" />
        
        {/* Headings */}
        <button
          type="button"
          onClick={() => execCommand('formatBlock', '<h2>')}
          className="p-2 rounded hover:bg-slate-100 transition-colors text-sm font-bold"
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => execCommand('formatBlock', '<h3>')}
          className="p-2 rounded hover:bg-slate-100 transition-colors text-sm font-bold"
          title="Heading 3"
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => execCommand('formatBlock', '<p>')}
          className="p-2 rounded hover:bg-slate-100 transition-colors text-sm"
          title="Paragraph"
        >
          P
        </button>
        
        <div className="w-px h-6 bg-slate-300 mx-1" />
        
        {/* Text formatting */}
        <ToolbarButton icon={Bold} command="bold" title="In đậm (Ctrl+B)" />
        <ToolbarButton icon={Italic} command="italic" title="In nghiêng (Ctrl+I)" />
        <ToolbarButton icon={Underline} command="underline" title="Gạch chân (Ctrl+U)" />
        
        <div className="w-px h-6 bg-slate-300 mx-1" />
        
        {/* Lists */}
        <ToolbarButton icon={List} command="insertUnorderedList" title="Danh sách không đánh số" />
        <ToolbarButton icon={ListOrdered} command="insertOrderedList" title="Danh sách đánh số" />
        
        <div className="w-px h-6 bg-slate-300 mx-1" />
        
        {/* Alignment */}
        <ToolbarButton icon={AlignLeft} command="justifyLeft" title="Căn trái" />
        <ToolbarButton icon={AlignCenter} command="justifyCenter" title="Căn giữa" />
        <ToolbarButton icon={AlignRight} command="justifyRight" title="Căn phải" />
        
        <div className="w-px h-6 bg-slate-300 mx-1" />
        
        {/* Quote & Code */}
        <button
          type="button"
          onClick={() => execCommand('formatBlock', '<blockquote>')}
          className="p-2 rounded hover:bg-slate-100 transition-colors"
          title="Trích dẫn"
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('formatBlock', '<pre>')}
          className="p-2 rounded hover:bg-slate-100 transition-colors"
          title="Code block"
        >
          <Code className="w-4 h-4" />
        </button>
        
        <div className="w-px h-6 bg-slate-300 mx-1" />
        
        {/* Link & Image */}
        <button
          type="button"
          onClick={() => setShowLinkInput(!showLinkInput)}
          className={`p-2 rounded hover:bg-slate-100 transition-colors ${showLinkInput ? 'bg-slate-200' : ''}`}
          title="Chèn link"
        >
          <Link className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={insertImage}
          className="p-2 rounded hover:bg-slate-100 transition-colors"
          title="Chèn ảnh"
        >
          <Image className="w-4 h-4" />
        </button>
      </div>

      {/* Link Input */}
      {showLinkInput && (
        <div className="flex items-center gap-2 p-2 border-b bg-blue-50">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 px-2 py-1 border rounded text-sm"
            onKeyDown={(e) => e.key === 'Enter' && insertLink()}
          />
          <Button size="sm" onClick={insertLink}>Chèn</Button>
          <Button size="sm" variant="ghost" onClick={() => setShowLinkInput(false)}>Hủy</Button>
        </div>
      )}

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        className="p-4 focus:outline-none prose prose-slate max-w-none"
        style={{ minHeight }}
        dangerouslySetInnerHTML={{ __html: value || '' }}
        data-placeholder={placeholder}
      />

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        [contenteditable] h2 {
          font-size: 1.5rem;
          font-weight: bold;
          margin: 1rem 0;
        }
        [contenteditable] h3 {
          font-size: 1.25rem;
          font-weight: bold;
          margin: 0.75rem 0;
        }
        [contenteditable] blockquote {
          border-left: 4px solid #316585;
          padding-left: 1rem;
          margin: 1rem 0;
          color: #64748b;
          font-style: italic;
        }
        [contenteditable] pre {
          background: #f1f5f9;
          padding: 1rem;
          border-radius: 0.5rem;
          font-family: monospace;
          overflow-x: auto;
        }
        [contenteditable] ul, [contenteditable] ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        [contenteditable] a {
          color: #316585;
          text-decoration: underline;
        }
        [contenteditable] img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
        }
      `}</style>
    </div>
  );
}
