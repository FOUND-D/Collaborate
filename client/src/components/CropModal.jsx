import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';
import './CropModal.css';

const CropModal = ({ image, onCropComplete, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropChange = (crop) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom) => {
    setZoom(zoom);
  };

  const onCropAreaComplete = useCallback((_area, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleCrop = async () => {
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      onCropComplete(croppedImage);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="crop-modal-overlay">
      <div className="crop-modal-container">
        <div className="crop-modal-header">
          <h3>Crop Photo</h3>
          <button className="close-btn" onClick={onCancel}>&times;</button>
        </div>
        <div className="crop-container">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={onCropChange}
            onCropComplete={onCropAreaComplete}
            onZoomChange={onZoomChange}
            cropShape="round"
            showGrid={false}
          />
        </div>
        <div className="crop-modal-footer">
          <div className="zoom-slider">
            <span>Zoom</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => onZoomChange(Number(e.target.value))}
            />
          </div>
          <div className="action-btns">
            <button className="btn-cancel" onClick={onCancel}>Cancel</button>
            <button className="btn-crop" onClick={handleCrop}>Apply Crop</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CropModal;
