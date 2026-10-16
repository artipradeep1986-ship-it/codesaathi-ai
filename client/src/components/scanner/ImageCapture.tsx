import React, { useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Camera, Image as ImageIcon, UploadCloud } from 'lucide-react';
import { Button } from '../ui/Button';

export interface ImageCaptureProps {
  onAddImages: (files: File[]) => void;
  disabled?: boolean;
}

export const ImageCapture: React.FC<ImageCaptureProps> = ({ onAddImages, disabled = false }) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    disabled,
    multiple: true,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onAddImages(acceptedFiles);
      }
    },
  });

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onAddImages(filesArray);
      e.target.value = ''; // Reset input
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden file input strictly for direct camera capture on mobile */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraCapture}
        className="hidden"
      />

      {/* Primary Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          type="button"
          variant="primary"
          size="lg"
          icon={<Camera className="w-5 h-5" />}
          onClick={() => cameraInputRef.current?.click()}
          disabled={disabled}
          fullWidth
          className="shadow-sm"
        >
          Take Photo with Camera
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="lg"
          icon={<ImageIcon className="w-5 h-5" />}
          onClick={() => {
            // Trigger dropzone file dialog
            const input = document.getElementById('dropzone-file-input');
            input?.click();
          }}
          disabled={disabled}
          fullWidth
        >
          Select from Gallery
        </Button>
      </div>

      {/* Drag & Drop Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-card p-6 text-center cursor-pointer transition-all duration-150 ${
          isDragActive
            ? 'border-primary bg-primary-50/50 scale-[1.01]'
            : 'border-border hover:border-primary/50 bg-surface-soft/40'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps({ id: 'dropzone-file-input' })} />
        <div className="w-12 h-12 mx-auto rounded-full bg-primary-50 text-primary flex items-center justify-center mb-3">
          <UploadCloud className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-text mb-1">
          {isDragActive ? 'Drop notebook images here...' : 'Drag & drop notebook photos here'}
        </p>
        <p className="text-xs text-text-muted">
          Supports JPG, PNG, WEBP (Single or multi-page handwritten code)
        </p>
      </div>
    </div>
  );
};
