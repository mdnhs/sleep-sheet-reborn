/* eslint-disable @next/next/no-img-element */
"use client";
import { Upload, X } from "lucide-react";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  FieldValues,
  Path,
  UseFormReturn,
  FieldPathValue,
} from "react-hook-form";

interface FileUploadProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
}

export function FileUpload<T extends FieldValues>({
  form,
  name,
}: FileUploadProps<T>) {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB

  const files = form.watch(name) as Array<File | string>;

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      form.setValue(name, [...files, ...acceptedFiles] as FieldPathValue<
        T,
        Path<T>
      >);
    },
    [form, name, files]
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
    form.setValue(name, newFiles as FieldPathValue<T, Path<T>>);
  };

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer 
          ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}
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
          <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 5MB</p>
          <p className="text-xs text-gray-500">
            {files?.length > 0
              ? `${files.length} file(s) selected`
              : "No files chosen"}
          </p>
        </div>
      </div>

      {files?.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-4">
          {files.map((file, index) => (
            <div key={index} className="relative group">
              <img
                src={file instanceof File ? URL.createObjectURL(file) : file}
                alt={`Preview ${index}`}
                className="h-24 w-full object-cover rounded-md border"
                onLoad={() => {
                  if (file instanceof File) {
                    URL.revokeObjectURL(URL.createObjectURL(file));
                  }
                }}
              />
              <button
                type="button"
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 
                  transition-opacity cursor-pointer bg-red-500 rounded-full p-1"
                onClick={() => removeFile(index)}
              >
                <X className="h-3 w-3 text-white" />
              </button>
              <div className="text-xs mt-1 truncate">
                {file instanceof File ? file.name : "External URL"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
