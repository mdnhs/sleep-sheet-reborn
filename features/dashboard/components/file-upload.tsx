/* eslint-disable @next/next/no-img-element */
"use client";
import { Upload, X, RefreshCw } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  FieldValues,
  Path,
  UseFormReturn,
  FieldPathValue,
} from "react-hook-form";

interface FileUploadProps<T extends FieldValues> {
  form?: UseFormReturn<T>;
  name?: Path<T>;
  value?: (File | string)[];
  onChange?: (files: (File | string)[]) => void;
  endpoint?: string;
}

export function FileUpload<T extends FieldValues>({
  form,
  name,
  value,
  onChange,
}: FileUploadProps<T>) {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB

  const files = (form && name ? form.watch(name) : value) as Array<File | string> || [];
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = [...files, ...acceptedFiles];
      if (form && name) {
        form.setValue(name, newFiles as any);
      }
      if (onChange) {
        onChange(newFiles);
      }
    },
    [form, name, files, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpeg", ".jpg"],
      "image/webp": [".webp"],
    },
    maxSize: MAX_SIZE,
    multiple: true,
    onDrop,
  });

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    if (onChange) onChange(newFiles);
    if (form && name) {
      form.setValue(name, newFiles as FieldPathValue<T, Path<T>>);
    }
  };

  const handleReplaceClick = (index: number) => {
    setReplaceIndex(index);
    fileInputRef.current?.click();
  };

  const onReplaceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && replaceIndex !== null) {
      const newFiles = [...files];
      newFiles[replaceIndex] = file;
      if (form && name) {
        form.setValue(name, newFiles as any);
      }
      if (onChange) {
        onChange(newFiles);
      }
    }
    setReplaceIndex(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer 
          ${isDragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10" : "border-gray-300 dark:border-slate-700"}`}
      >
        <input {...getInputProps()} />
        <div className="space-y-2">
          <div className="flex items-center justify-center">
            <Upload size={32} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">
            {isDragActive
              ? "Drop images here"
              : "Upload a file or drag and drop"}
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-400">PNG, JPG, WEBP up to 5MB</p>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {files?.length > 0
              ? `${files.length} file(s) selected`
              : "No files chosen"}
          </p>
        </div>
      </div>

      {files?.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-4">
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={onReplaceFile}
            accept="image/png, image/jpeg, image/webp"
          />
          {files.map((file, index) => (
            <div key={index} className="relative group overflow-hidden rounded-md border">
              <img
                src={file instanceof File ? URL.createObjectURL(file) : file}
                alt={`Preview ${index}`}
                className="h-24 w-full object-cover transition-opacity group-hover:opacity-60"
                onLoad={() => {
                  if (file instanceof File) {
                    URL.revokeObjectURL(URL.createObjectURL(file));
                  }
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                <button
                  type="button"
                  title="Replace Image"
                  className="p-2 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur-sm transition-colors text-white mr-2"
                  onClick={() => handleReplaceClick(index)}
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Remove Image"
                  className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full backdrop-blur-sm transition-colors text-white"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 text-[10px] p-1 bg-black/50 text-white truncate text-center">
                {file instanceof File ? file.name : "External URL"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
