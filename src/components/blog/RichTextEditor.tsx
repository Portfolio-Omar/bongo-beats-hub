import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight,
  Heading1, Heading2, Heading3, List, ListOrdered, Link as LinkIcon, Image as ImageIcon,
  Quote, Minus, Undo, Redo,
} from 'lucide-react';
import { useState } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  const handleInsertLink = () => {
    if (linkUrl.trim()) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    }
    setShowLinkDialog(false);
    setLinkUrl('');
  };

  const handleInsertImage = () => {
    if (imageUrl.trim()) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
    }
    setShowImageDialog(false);
    setImageUrl('');
  };

  const ToolBtn = ({ icon, action, isActive, tooltip }: { icon: React.ReactNode; action: () => void; isActive?: boolean; tooltip: string }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant={isActive ? 'secondary' : 'ghost'} size="sm" onClick={(e) => { e.preventDefault(); action(); }} className="h-8 w-8 p-0">
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent><p>{tooltip}</p></TooltipContent>
    </Tooltip>
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1 p-2 bg-muted/50 border rounded-t-md">
        <TooltipProvider>
          <ToolBtn icon={<Bold size={16} />} action={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} tooltip="Bold" />
          <ToolBtn icon={<Italic size={16} />} action={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} tooltip="Italic" />
          <ToolBtn icon={<UnderlineIcon size={16} />} action={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} tooltip="Underline" />
          <div className="w-px bg-border mx-1" />
          <ToolBtn icon={<Heading1 size={16} />} action={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} tooltip="Heading 1" />
          <ToolBtn icon={<Heading2 size={16} />} action={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} tooltip="Heading 2" />
          <ToolBtn icon={<Heading3 size={16} />} action={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} tooltip="Heading 3" />
          <div className="w-px bg-border mx-1" />
          <ToolBtn icon={<List size={16} />} action={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} tooltip="Bullet List" />
          <ToolBtn icon={<ListOrdered size={16} />} action={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} tooltip="Numbered List" />
          <ToolBtn icon={<Quote size={16} />} action={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} tooltip="Blockquote" />
          <ToolBtn icon={<Minus size={16} />} action={() => editor.chain().focus().setHorizontalRule().run()} tooltip="Horizontal Rule" />
          <div className="w-px bg-border mx-1" />
          <ToolBtn icon={<AlignLeft size={16} />} action={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} tooltip="Align Left" />
          <ToolBtn icon={<AlignCenter size={16} />} action={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} tooltip="Center" />
          <ToolBtn icon={<AlignRight size={16} />} action={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} tooltip="Align Right" />
          <div className="w-px bg-border mx-1" />
          <ToolBtn icon={<LinkIcon size={16} />} action={() => setShowLinkDialog(true)} isActive={editor.isActive('link')} tooltip="Insert Link" />
          <ToolBtn icon={<ImageIcon size={16} />} action={() => setShowImageDialog(true)} tooltip="Insert Image" />
          <div className="w-px bg-border mx-1" />
          <ToolBtn icon={<Undo size={16} />} action={() => editor.chain().focus().undo().run()} tooltip="Undo" />
          <ToolBtn icon={<Redo size={16} />} action={() => editor.chain().focus().redo().run()} tooltip="Redo" />
        </TooltipProvider>
      </div>

      <div className="border border-t-0 rounded-b-md p-4 min-h-[300px] prose prose-sm dark:prose-invert max-w-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 rounded-b-md">
        <EditorContent editor={editor} className="outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[250px]" />
      </div>

      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Insert Link</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>URL</Label>
              <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://example.com" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>Cancel</Button>
            <Button onClick={handleInsertLink}>Insert</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Insert Image</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Image URL</Label>
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImageDialog(false)}>Cancel</Button>
            <Button onClick={handleInsertImage}>Insert</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RichTextEditor;
