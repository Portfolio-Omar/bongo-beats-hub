
import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content, className }) => {
  return (
    <div className={`prose prose-stone dark:prose-invert max-w-none ${className || ''}`}>
      <ReactMarkdown>{content || ''}</ReactMarkdown>
    </div>
  );
};

export default MarkdownPreview;
