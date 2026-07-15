import React, { useEffect, useRef, useState } from 'react';
import { FiX, FiCamera, FiAlertCircle } from 'react-icons/fi';

/**
 * BarcodeScanner Component
 * Uses ZXing library for barcode/QR scanning via camera
 * Props:
 *   onScan(result) - called with scanned value
 *   onClose() - called when scanner is closed
 */
const BarcodeScanner = ({ onScan, onClose }) => {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const codeReaderRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const startScanner = async () => {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/library');
        const codeReader = new BrowserMultiFormatReader();
        codeReaderRef.current = codeReader;

        const devices = await codeReader.listVideoInputDevices();
        if (!devices || devices.length === 0) {
          setError('No camera found. Please use manual input.');
          return;
        }

        setScanning(true);
        const selectedDevice = devices[devices.length - 1]; // prefer rear camera

        await codeReader.decodeFromVideoDevice(
          selectedDevice.deviceId,
          videoRef.current,
          (result, err) => {
            if (result && mounted) {
              const scannedText = result.getText();
              if (onScan) onScan(scannedText);
              stopScanner();
            }
          }
        );
      } catch (err) {
        if (mounted) {
          setError(`Camera error: ${err.message}. Use manual input below.`);
        }
      }
    };

    const stopScanner = () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
        codeReaderRef.current = null;
      }
      setScanning(false);
    };

    startScanner();

    return () => {
      mounted = false;
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, []);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      if (onScan) onScan(manualInput.trim());
      onClose?.();
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h3 className="modal-title">
            <FiCamera style={{ marginRight: 8, color: 'var(--primary-light)' }} />
            Barcode Scanner
          </h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><FiX /></button>
        </div>

        <div className="modal-body">
          {/* Camera View */}
          <div style={{
            position: 'relative',
            background: '#000',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
            marginBottom: 16,
            minHeight: 220,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <video
              ref={videoRef}
              style={{ width: '100%', display: error ? 'none' : 'block', maxHeight: 260 }}
              autoPlay
              playsInline
              muted
            />

            {/* Scanning overlay */}
            {scanning && !error && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {/* Corner brackets */}
                {[
                  { top: '20%', left: '20%', borderTop: '3px solid var(--primary)', borderLeft: '3px solid var(--primary)' },
                  { top: '20%', right: '20%', borderTop: '3px solid var(--primary)', borderRight: '3px solid var(--primary)' },
                  { bottom: '20%', left: '20%', borderBottom: '3px solid var(--primary)', borderLeft: '3px solid var(--primary)' },
                  { bottom: '20%', right: '20%', borderBottom: '3px solid var(--primary)', borderRight: '3px solid var(--primary)' },
                ].map((s, i) => (
                  <div key={i} style={{ position: 'absolute', width: 28, height: 28, ...s }} />
                ))}
                {/* Scan line animation */}
                <div style={{
                  position: 'absolute', left: '20%', right: '20%', height: 2,
                  background: 'var(--primary)', opacity: 0.8,
                  animation: 'scanLine 2s ease-in-out infinite',
                }} />
              </div>
            )}

            {error && (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>
                <FiAlertCircle size={32} style={{ color: 'var(--warning)', marginBottom: 8 }} />
                <p style={{ fontSize: '0.85rem' }}>{error}</p>
              </div>
            )}

            {!scanning && !error && (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>
                <div className="spinner" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: '0.85rem' }}>Starting camera...</p>
              </div>
            )}
          </div>

          {scanning && !error && (
            <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
              📷 Point camera at barcode or QR code
            </p>
          )}

          {/* Manual Input */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>
              Or enter barcode manually:
            </p>
            <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                className="form-control"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Enter SKU or barcode..."
                autoFocus={!!error}
              />
              <button type="submit" className="btn btn-primary" disabled={!manualInput.trim()}>
                Use
              </button>
            </form>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>

      <style>{`
        @keyframes scanLine {
          0% { top: 20%; }
          50% { top: 80%; }
          100% { top: 20%; }
        }
      `}</style>
    </div>
  );
};

export default BarcodeScanner;
