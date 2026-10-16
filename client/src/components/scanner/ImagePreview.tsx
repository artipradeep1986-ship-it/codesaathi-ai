import React, { useState } from 'react';
import type { ScannerPage } from '../../stores/scannerStore';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { RotateCw, Trash2, Check } from 'lucide-react';

export interface ImagePreviewProps {
  page: ScannerPage | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdateImage?: (id: string, newFile: File, newPreview: string) => void;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  page,
  onClose,
  onDelete,
}) => {
  const [rotation, setRotation] = useState(0);

  if (!page) return null;

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleDelete = () => {
    onDelete(page.id);
    onClose();
  };

  return (
    <Modal
      isOpen={!!page}
      onClose={onClose}
      maxWidth="lg"
      title={`Page ${page.pageNumber} Preview`}
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={handleDelete}
          >
            Delete Page
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<RotateCw className="w-4 h-4" />}
              onClick={handleRotate}
            >
              Rotate
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Check className="w-4 h-4" />}
              onClick={onClose}
            >
              Done
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col items-center justify-center p-2 min-h-[300px] max-h-[60vh] overflow-hidden bg-slate-950 rounded-card">
        <img
          src={page.preview}
          alt={`Page ${page.pageNumber}`}
          style={{ transform: `rotate(${rotation}deg)` }}
          className="max-h-[55vh] max-w-full object-contain transition-transform duration-200"
        />
      </div>
    </Modal>
  );
};
