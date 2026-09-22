'use client';

import { useState, useRef } from 'react';
import { Paperclip, FileText, Image as ImageIcon, X } from 'lucide-react';

interface AttachMenuProps {
  onFileSelect?: (file: File | null) => void;
}

export default function AttachMenu({ onFileSelect }: AttachMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelect = (acceptType: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = acceptType;
      fileInputRef.current.click();
    }
    setIsOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > 10 * 1024 * 1024) {
      e.target.value = '';
      return;
    }
    setSelectedFile(file);
    if (onFileSelect) onFileSelect(file);
  };

  const handleRemove = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onFileSelect) onFileSelect(null);
  };

  return (
    <div className="relative inline-flex items-center">
      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Selected File Tag */}
      {selectedFile && (
        <div className="mr-2 flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-200">
          <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="max-w-[120px] truncate">{selectedFile.name}</span>
          <button
            type="button"
            onClick={handleRemove}
            className="text-zinc-400 hover:text-zinc-100 ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-lg transition-colors"
        title="Attach file"
      >
        <Paperclip className="w-4 h-4" />
      </button>

      {/* Floating Menu Popover */}
      {isOpen && (
        <div className="absolute bottom-11 left-0 w-44 bg-zinc-900 border border-zinc-800 rounded-xl p-1.5 shadow-xl z-30 space-y-0.5">
          <button
            type="button"
            onClick={() => handleSelect('image/*')}
            className="flex items-center gap-2.5 w-full px-2.5 py-2 text-xs text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors text-left"
          >
            <ImageIcon className="w-4 h-4 text-emerald-400" />
            Upload Image
          </button>
          <button
            type="button"
            onClick={() => handleSelect('.pdf,.txt,.csv,.json')}
            className="flex items-center gap-2.5 w-full px-2.5 py-2 text-xs text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors text-left"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            Upload Document
          </button>
        </div>
      )}
    </div>
  );
}