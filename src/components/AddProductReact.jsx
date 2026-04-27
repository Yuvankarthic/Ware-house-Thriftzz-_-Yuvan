import React, { useCallback, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, Star, Image as ImageIcon, GripVertical, Upload } from 'lucide-react';

export function ProductImageUpload({
  images = [],
  onChange,
  maxImages = 10,
  accept = 'image/*',
}) {
  const [isUploading, setIsUploading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;

      if (active.id !== over?.id) {
        const oldIndex = images.findIndex((img) => img.id === active.id);
        const newIndex = images.findIndex((img) => img.id === over?.id);
        const newImages = arrayMove(images, oldIndex, newIndex).map((img, idx) => ({
          ...img,
          isPrimary: idx === 0,
        }));
        onChange(newImages);
      }
    },
    [images, onChange]
  );

  const handleFileSelect = useCallback(
    async (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      if (images.length + files.length > maxImages) {
        alert(`Maximum ${maxImages} images allowed`);
        return;
      }

      setIsUploading(true);

      try {
        const newImages = await Promise.all(
          files.map(async (file) => {
            const preview = URL.createObjectURL(file);
            return {
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              file,
              preview,
              url: null,
              isPrimary: images.length === 0 && !images.some((img) => img.isPrimary),
              isExisting: false,
            };
          })
        );

        const updatedImages = [...images, ...newImages].map((img, idx) => ({
          ...img,
          isPrimary: idx === 0,
        }));

        onChange(updatedImages);
      } finally {
        setIsUploading(false);
        e.target.value = '';
      }
    },
    [images, maxImages, onChange]
  );

  const removeImage = useCallback(
    (id) => {
      const newImages = images
        .filter((img) => img.id !== id)
        .map((img, idx) => ({
          ...img,
          isPrimary: idx === 0,
        }));
      onChange(newImages);
    },
    [images, onChange]
  );

  const setAsPrimary = useCallback(
    (id) => {
      const newImages = images
        .map((img) => ({
          ...img,
          isPrimary: img.id === id,
        }))
        .sort((a, b) => {
          if (a.isPrimary) return -1;
          if (b.isPrimary) return 1;
          return 0;
        });
      onChange(newImages);
    },
    [images, onChange]
  );

  const handleReorder = useCallback(
    (activeId, overId) => {
      if (activeId === overId) return;
      const oldIndex = images.findIndex((img) => img.id === activeId);
      const newIndex = images.findIndex((img) => img.id === overId);
      if (oldIndex === -1 || newIndex === -1) return;

      const newImages = arrayMove(images, oldIndex, newIndex).map((img, idx) => ({
        ...img,
        isPrimary: idx === 0,
      }));
      onChange(newImages);
    },
    [images, onChange]
  );

  return (
    <div className="product-image-upload">
      <input
        type="file"
        accept={accept}
        multiple
        onChange={handleFileSelect}
        id="image-upload-input"
        className="hidden"
      />

      {images.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(e) => handleDragEnd(e)}
        >
          <SortableContext items={images.map((i) => i.id)} strategy={rectSortingStrategy}>
            <div className="image-grid">
              {images.map((image, index) => (
                <SortableImageCard
                  key={image.id}
                  image={image}
                  index={index}
                  onRemove={() => removeImage(image.id)}
                  onSetPrimary={() => setAsPrimary(image.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {images.length < maxImages && (
        <label
          htmlFor="image-upload-input"
          className={`upload-dropzone ${images.length === 0 ? 'empty' : ''}`}
        >
          <div className="upload-content">
            {isUploading ? (
              <div className="upload-loading">
                <div className="spinner" />
                <span>Compressing...</span>
              </div>
            ) : (
              <>
                <Upload size={32} strokeWidth={1.5} />
                <span className="upload-text">
                  Drop images here or <strong>click to browse</strong>
                </span>
                <span className="upload-hint">
                  {images.length}/{maxImages} images • First image is cover
                </span>
              </>
            )}
          </div>
        </label>
      )}

      <DragOverlay>
        {null}
      </DragOverlay>

      <style>{`
        .product-image-upload {
          width: 100%;
        }

        .hidden {
          display: none;
        }

        .image-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }

        .upload-dropzone {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 160px;
          border: 2px dashed #e5e7eb;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #fafafa;
        }

        .upload-dropzone:hover {
          border-color: #1a1a2e;
          background: #f5f5f5;
        }

        .upload-dropzone.empty {
          border-style: solid;
        }

        .upload-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 24px;
          text-align: center;
        }

        .upload-content svg {
          color: #9ca3af;
        }

        .upload-text {
          font-size: 0.95rem;
          color: #374151;
        }

        .upload-text strong {
          color: #1a1a2e;
        }

        .upload-hint {
          font-size: 0.8rem;
          color: #9ca3af;
        }

        .upload-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .spinner {
          width: 24px;
          height: 24px;
          border: 2px solid #e5e7eb;
          border-top-color: #1a1a2e;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 640px) {
          .image-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
}

function SortableImageCard({ image, index, onRemove, onSetPrimary }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`image-card ${image.isPrimary ? 'primary' : ''} ${isDragging ? 'dragging' : ''}`}
    >
      <div className="image-card-inner">
        <div className="image-preview-wrap">
          <img
            src={image.preview || image.url}
            alt={`Product ${index + 1}`}
            className="image-preview"
          />
          {image.isPrimary && (
            <div className="primary-badge">
              <Star size={10} fill="currentColor" />
              <span>Cover</span>
            </div>
          )}
        </div>

        <div className="image-actions">
          <button
            type="button"
            className="action-btn drag-handle"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={16} />
          </button>

          {!image.isPrimary && (
            <button
              type="button"
              className="action-btn set-primary"
              onClick={onSetPrimary}
              title="Set as cover image"
            >
              <Star size={14} />
            </button>
          )}

          <button
            type="button"
            className="action-btn remove"
            onClick={onRemove}
            title="Remove image"
          >
            <X size={14} />
          </button>
        </div>

        <div className="image-number">{index + 1}</div>
      </div>

      <style>{`
        .image-card {
          position: relative;
          aspect-ratio: 1;
          border-radius: 10px;
          overflow: hidden;
          background: #f3f4f6;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          transition: all 0.2s ease;
        }

        .image-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        }

        .image-card.primary {
          ring: 2px solid #1a1a2e;
          box-shadow: 0 0 0 2px #1a1a2e;
        }

        .image-card.dragging {
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        }

        .image-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .image-preview-wrap {
          width: 100%;
          height: 100%;
        }

        .image-preview {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .primary-badge {
          position: absolute;
          top: 6px;
          left: 6px;
          display: flex;
          align-items: center;
          gap: 3px;
          padding: 3px 6px;
          background: #1a1a2e;
          color: #fff;
          border-radius: 4px;
          font-size: 0.65rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .image-actions {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 6px;
          opacity: 0;
          transition: opacity 0.2s ease;
          background: rgba(0, 0, 0, 0.4);
        }

        .image-card:hover .image-actions {
          opacity: 1;
        }

        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .drag-handle {
          background: rgba(255, 255, 255, 0.9);
          color: #374151;
          cursor: grab;
        }

        .drag-handle:active {
          cursor: grabbing;
        }

        .set-primary {
          background: rgba(255, 255, 255, 0.9);
          color: #f59e0b;
        }

        .set-primary:hover {
          background: #f59e0b;
          color: #fff;
        }

        .remove {
          background: #ef4444;
          color: #fff;
          margin-left: auto;
        }

        .remove:hover {
          background: #dc2626;
        }

        .image-number {
          position: absolute;
          bottom: 6px;
          right: 6px;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.6);
          color: #fff;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}

export function prepareProductPayload(values, images) {
  const imageOrder = images
    .filter((img) => !img.isExisting || img.file)
    .map((img, idx) => ({
      url: img.url || null,
      file: img.file || null,
      isPrimary: idx === 0,
    }));

  return {
    name: values.name,
    price: values.price,
    category: values.category,
    size: values.size,
    fit: values.fit,
    condition: values.condition,
    chest_length: values.chest_length,
    shoulder_length: values.shoulder_length,
    show_on_main: values.show_on_main,
    images: imageOrder,
  };
}

export function useExistingImages(product) {
  if (!product?.image_urls || !Array.isArray(product.image_urls)) return [];

  return product.image_urls.map((url, index) => ({
    id: `existing-${index}-${url}`,
    url,
    preview: url,
    isPrimary: index === 0,
    isExisting: true,
    file: null,
  }));
}