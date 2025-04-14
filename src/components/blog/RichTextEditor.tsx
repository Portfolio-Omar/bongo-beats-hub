
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Heading1, Heading2, Heading3, List, ListOrdered, Link as LinkIcon
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleSelection = () => {
    if (textareaRef.current) {
      setSelection({
        start: textareaRef.current.selectionStart,
        end: textareaRef.current.selectionEnd
      });
      
      // If there's text selected, set it as link text
      if (textareaRef.current.selectionStart !== textareaRef.current.selectionEnd) {
        setLinkText(value.substring(
          textareaRef.current.selectionStart,
          textareaRef.current.selectionEnd
        ));
      }
    }
  };

  const insertFormatting = (prefix: string, suffix: string = prefix) => {
    const newValue = value.substring(0, selection.start) + 
                      prefix + 
                      value.substring(selection.start, selection.end) + 
                      suffix + 
                      value.substring(selection.end);
    
    onChange(newValue);
    
    // Re-focus the textarea after formatting is applied
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(
          selection.start + prefix.length,
          selection.end + prefix.length
        );
      }
    }, 0);
  };
  
  const handleInsertLink = () => {
    if (!linkUrl.trim()) return;
    
    const linkMarkdown = `[${linkText || linkUrl}](${linkUrl})`;
    const newValue = value.substring(0, selection.start) + 
                     linkMarkdown + 
                     value.substring(selection.end);
    
    onChange(newValue);
    setShowLinkDialog(false);
    setLinkUrl('');
    setLinkText('');
    
    // Re-focus the textarea after inserting link
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 0);
  };

  const formatButtons = [
    { icon: <Bold size={16} />, action: () => insertFormatting('**'), tooltip: 'Bold' },
    { icon: <Italic size={16} />, action: () => insertFormatting('*'), tooltip: 'Italic' },
    { icon: <Underline size={16} />, action: () => insertFormatting('__'), tooltip: 'Underline' },
    { icon: <Heading1 size={16} />, action: () => insertFormatting('# '), tooltip: 'Heading 1' },
    { icon: <Heading2 size={16} />, action: () => insertFormatting('## '), tooltip: 'Heading 2' },
    { icon: <Heading3 size={16} />, action: () => insertFormatting('### '), tooltip: 'Heading 3' },
    { icon: <List size={16} />, action: () => insertFormatting('- '), tooltip: 'Bullet List' },
    { icon: <ListOrdered size={16} />, action: () => insertFormatting('1. '), tooltip: 'Numbered List' },
    { icon: <LinkIcon size={16} />, action: () => setShowLinkDialog(true), tooltip: 'Insert Link' },
    { icon: <AlignLeft size={16} />, action: () => insertFormatting('<div style="text-align: left;">', '</div>'), tooltip: 'Align Left' },
    { icon: <AlignCenter size={16} />, action: () => insertFormatting('<div style="text-align: center;">', '</div>'), tooltip: 'Align Center' },
    { icon: <AlignRight size={16} />, action: () => insertFormatting('<div style="text-align: right;">', '</div>'), tooltip: 'Align Right' },
  ];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1 p-1 bg-background border rounded-md">
        <TooltipProvider>
          {formatButtons.map((button, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    button.action();
                  }}
                  className="h-8 w-8 p-0"
                >
                  {button.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{button.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
      
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onSelect={handleSelection}
        onFocus={handleSelection}
        onClick={handleSelection}
        className="min-h-[300px] font-mono"
        placeholder="Write your blog content here using markdown formatting..."
      />
      
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="linkText">Link Text</Label>
              <Input
                id="linkText"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Text to display"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="linkUrl">URL</Label>
              <Input
                id="linkUrl"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>Cancel</Button>
            <Button onClick={handleInsertLink}>Insert</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RichTextEditor;
