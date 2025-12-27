'use client';

import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Upload, File, X, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './button';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  acceptedFormats?: string[];
  maxSize?: number; // per file in MB
  maxFiles?: number; // max number of files
  maxTotalSize?: number; // max total size in MB
  className?: string;
}

export function FileUpload({
  onFileSelect,
  acceptedFormats = ['.xlsx', '.xls', '.pdf'],
  maxSize = 20,
  maxFiles = 3,
  maxTotalSize = 50,
  className,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string>('');

  const validateFiles = (files: File[]): boolean => {
    setError('');

    // Check number of files
    if (files.length > maxFiles) {
      setError(`최대 ${maxFiles}개의 파일만 업로드할 수 있습니다.`);
      return false;
    }

    // Check each file
    for (const file of files) {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!acceptedFormats.includes(fileExtension)) {
        setError(`지원하지 않는 파일 형식입니다. (${acceptedFormats.join(', ')}만 가능)`);
        return false;
      }

      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxSize) {
        setError(`${file.name}: 파일 크기가 너무 큽니다. (최대 ${maxSize}MB)`);
        return false;
      }
    }

    // Check total size
    const totalSizeMB = files.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024);
    if (totalSizeMB > maxTotalSize) {
      setError(`전체 파일 크기가 너무 큽니다. (최대 ${maxTotalSize}MB, 현재 ${totalSizeMB.toFixed(1)}MB)`);
      return false;
    }

    return true;
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    if (validateFiles(files)) {
      setSelectedFiles(files);
      onFileSelect(files);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    handleFiles(e.target.files);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    if (newFiles.length === 0) {
      setError('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      onFileSelect(newFiles);
    }
  };

  const handleRemoveAll = () => {
    setSelectedFiles([]);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        accept={acceptedFormats.join(',')}
        onChange={handleChange}
      />

      {selectedFiles.length === 0 ? (
        <div
          className={cn(
            'relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
            dragActive
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-primary-500 hover:bg-gray-50'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleButtonClick}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            파일을 드래그하거나 클릭하여 업로드
          </p>
          <p className="text-sm text-gray-500 mb-1">
            {acceptedFormats.join(', ')} 파일 (파일당 최대 {maxSize}MB)
          </p>
          <p className="text-xs text-gray-400 mb-4">
            최대 {maxFiles}개 파일, 전체 {maxTotalSize}MB까지 업로드 가능
          </p>
          <Button type="button" variant="secondary" size="sm">
            파일 선택
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">
              선택된 파일 ({selectedFiles.length}/{maxFiles})
            </p>
            {selectedFiles.length > 1 && (
              <button
                type="button"
                onClick={handleRemoveAll}
                className="text-xs text-gray-500 hover:text-danger transition-colors"
              >
                모두 제거
              </button>
            )}
          </div>
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="border-2 border-success rounded-xl p-4 bg-success/5"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  className="flex-shrink-0 p-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          ))}
          <p className="text-xs text-gray-500 text-center mt-2">
            전체 크기: {(selectedFiles.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024)).toFixed(2)} MB / {maxTotalSize} MB
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 mt-3 p-3 bg-danger/10 rounded-lg">
          <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}
    </div>
  );
}
