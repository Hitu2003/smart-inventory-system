import React, { useState, useRef, useCallback } from 'react';
import { FiUploadCloud, FiX, FiStar, FiImage } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

/**
 * ProductImageUpload
 * Props:
 *   productId  {string}   - product _id
 *   images     {Array}    - existing product.images array
 *   onUpdate   {Function} - called with updated product after upload
 *   readOnly   {boolean}  - disable uploads (for view-only mode)
 */
const ProductImageUpload = ({ productId, images = [], onUpdate, readOnly = false }) => {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = useCallback(
    async (files) => {
      if (!files || files.length === 0) return;
      const file = files[0];

      // Client-side validation
      const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowed.includes(file.type)) {
        toast.error('Only JPG, PNG, and WebP images are allowed');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be under 5MB');
        return;
      }

      const formData = new FormData();
      formData.append('image', file);

      setUploading(true);
      try {
        const { data } = await api.post(`/products/${productId}/upload-image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Image uploaded successfully');
        if (onUpdate) onUpdate(data.data);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Upload failed');
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [productId, onUpdate]
  );

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (readOnly) return;
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!readOnly) setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleInputChange = (e) => handleFiles(e.target.files);

  const handleDeleteImage = async (imageUrl) => {
    // Optimistic UI — just notify parent to remove from local state
    // A full delete endpoint would be needed for server-side removal
    toast('Image removal requires a server-side delete endpoint. Contact admin.', { icon: 'ℹ️' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Drop Zone */}
      {!readOnly && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !uploading && fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? 'var(--primary)' : 'var(--border-light)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '32px 20px',
            textAlign: 'center',
            cursor: uploading ? 'not-allowed' : 'pointer',
            background: dragging ? 'rgba(99,102,241,0.06)' : 'var(--bg-input)',
            transition: 'all 0.2s ease',
            userSelect: 'none',
          }}
          role="button"
          tabIndex={0}
          aria-label="Upload product image"
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        >
          {uploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div className="spinner" style={{ width: 32, height: 32 }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Uploading…</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'rgba(99,102,241,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                }}
              >
                <FiUploadCloud size={24} />
              </div>
              <div>
                <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}>
                  {dragging ? 'Drop image here' : 'Drag & drop or click to upload'}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  JPG, PNG, WebP — max 5MB
                </p>
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={handleInputChange}
            disabled={uploading}
          />
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
            gap: 12,
          }}
        >
          {images.map((img, idx) => (
            <div
              key={img.url || idx}
              style={{
                position: 'relative',
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
                border: img.isPrimary
                  ? '2px solid var(--primary)'
                  : '2px solid var(--border)',
                background: 'var(--bg-input)',
                aspectRatio: '1',
              }}
            >
              <img
                src={img.url}
                alt={`Product image ${idx + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              {/* Fallback icon */}
              <div
                style={{
                  display: 'none',
                  width: '100%',
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                }}
              >
                <FiImage size={28} />
              </div>

              {/* Primary badge */}
              {img.isPrimary && (
                <div
                  style={{
                    position: 'absolute',
                    top: 5,
                    left: 5,
                    background: 'var(--primary)',
                    color: '#fff',
                    borderRadius: 4,
                    padding: '2px 5px',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <FiStar size={9} />
                  Primary
                </div>
              )}

              {/* Delete button */}
              {!readOnly && (
                <button
                  onClick={() => handleDeleteImage(img.url)}
                  style={{
                    position: 'absolute',
                    top: 5,
                    right: 5,
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: 'rgba(239,68,68,0.85)',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#ef4444')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.85)')}
                  aria-label="Remove image"
                  title="Remove image"
                >
                  <FiX size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: '20px',
            color: 'var(--text-muted)',
            fontSize: '0.875rem',
          }}
        >
          <FiImage size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
          <p>No images uploaded yet</p>
        </div>
      )}
    </div>
  );
};

export default ProductImageUpload;
