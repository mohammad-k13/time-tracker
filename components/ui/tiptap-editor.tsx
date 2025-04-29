'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered, Heading2 } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';

interface TiptapEditorProps {
      content: string;
      onChange: (content: string) => void;
      className?: string;
      placeholder?: string;
      disabled?: boolean;
}

export function TiptapEditor({
      content,
      onChange,
      className,
      placeholder = 'Add a description...',
      disabled = false,
}: TiptapEditorProps) {
      const editor = useEditor({
            extensions: [
                  StarterKit.configure({
                        bulletList: {
                              keepMarks: true,
                              keepAttributes: false,
                        },
                        orderedList: {
                              keepMarks: true,
                              keepAttributes: false,
                        },
                  }),
            ],
            content,
            editable: !disabled,
            onUpdate: ({ editor }) => {
                  onChange(editor.getHTML());
            },
            editorProps: {
                  attributes: {
                        class: 'prose dark:prose-invert prose-sm focus:outline-none max-w-none',
                        placeholder,
                  },
            },
      });

      if (!editor) {
            return null;
      }

      return (
            <div className={cn('border rounded-md', className)}>
                  <div className="flex items-center border-b p-2 gap-1">
                        <Toggle
                              size="sm"
                              pressed={editor.isActive('bold')}
                              onPressedChange={() => editor.chain().focus().toggleBold().run()}
                              disabled={disabled}
                              aria-label="Bold"
                        >
                              <Bold className="h-4 w-4" />
                        </Toggle>
                        <Toggle
                              size="sm"
                              pressed={editor.isActive('italic')}
                              onPressedChange={() => editor.chain().focus().toggleItalic().run()}
                              disabled={disabled}
                              aria-label="Italic"
                        >
                              <Italic className="h-4 w-4" />
                        </Toggle>
                        <Toggle
                              size="sm"
                              pressed={editor.isActive('heading', { level: 2 })}
                              onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                              disabled={disabled}
                              aria-label="Heading"
                        >
                              <Heading2 className="h-4 w-4" />
                        </Toggle>
                        <Toggle
                              size="sm"
                              pressed={editor.isActive('bulletList')}
                              onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
                              disabled={disabled}
                              aria-label="Bullet List"
                        >
                              <List className="h-4 w-4" />
                        </Toggle>
                        <Toggle
                              size="sm"
                              pressed={editor.isActive('orderedList')}
                              onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
                              disabled={disabled}
                              aria-label="Ordered List"
                        >
                              <ListOrdered className="h-4 w-4" />
                        </Toggle>
                  </div>
                  <EditorContent editor={editor} className="p-3 min-h-[100px] max-h-[300px] overflow-y-auto" />
            </div>
      );
}

export function TiptapContent({ content }: { content: string }) {
      return (
            <div
                  className="prose dark:prose-invert prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: content }}
            />
      );
}
