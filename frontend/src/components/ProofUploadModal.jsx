import React, { useState, useRef, useEffect } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import './ProofUploadModal.css';

const ProofUploadModal = ({ projectId, donationId, onClose, onSuccess }) => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    proofType: 'receipt',
    description: '',
    file: null,
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  const proofTypes = [
    { value: 'receipt', label: '📄 Receipt/Invoice' },
    { value: 'video', label: '📹 Video' },
    { value: 'document', label: '📋 Document' },
  ];

  const handleProofTypeChange = (e) => {
    setFormData({ ...formData, proofType: e.target.value });
  };

  const handleDescriptionChange = (e) => {
    setFormData({ ...formData, description: e.target.value });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setError('File size exceeds 50MB limit');
        return;
      }
      setFormData({ ...formData, file });
      setError('');
    }
  };

  const uploadToIPFS = async (file) => {
    // This is a placeholder - integrate with actual IPFS service
    // You can use Pinata, NFT.storage, or Web3.storage
    const formDataIPFS = new FormData();
    formDataIPFS.append('file', file);

    try {
      // Example: using NFT.storage or Pinata
      // const response = await fetch('https://api.nft.storage/upload', {
      //   method: 'POST',
      //   headers: { Authorization: `Bearer ${process.env.REACT_APP_NFT_STORAGE_KEY}` },
      //   body: formDataIPFS,
      // });
      // For now, return a mock IPFS hash
      return 'QmMockIPFSHash' + Math.random().toString(36).substr(2, 9);
    } catch (err) {
      throw new Error('IPFS upload failed: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.file) {
      setError('Please select a file');
      return;
    }
    if (!formData.description.trim()) {
      setError('Please provide a description');
      return;
    }
    if (formData.description.length < 20) {
      setError('Description must be at least 20 characters');
      return;
    }

    try {
      setUploading(true);

      // Step 1: Upload file to IPFS
      setSuccess('Uploading file to IPFS...');
      const proofIPFS = await uploadToIPFS(formData.file);

      // Step 2: Submit proof to backend
      setSuccess('Submitting proof to blockchain...');
      const response = await fetch(`/api/proofs/submit/${projectId}/${donationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          proofType: formData.proofType,
          proofIPFS,
          description: formData.description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit proof');
      }

      const result = await response.json();
      setSuccess('Proof submitted successfully! ✓');
      
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error submitting proof:', err);
      setError(err.message || 'Failed to submit proof');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Submit Proof of Fund Usage</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="proof-form">
          {/* Proof Type Selection */}
          <div className="form-group">
            <label className="form-label">Proof Type</label>
            <div className="proof-type-options">
              {proofTypes.map(type => (
                <label key={type.value} className="proof-type-option">
                  <input
                    type="radio"
                    name="proofType"
                    value={type.value}
                    checked={formData.proofType === type.value}
                    onChange={handleProofTypeChange}
                  />
                  <span>{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="description">
              Description (What did you do with the funds?)
              <span className="required">*</span>
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={handleDescriptionChange}
              placeholder="Describe in detail how these funds were used. Example: Purchased educational materials for 50 students, including textbooks and notebooks..."
              rows="4"
              disabled={uploading}
            />
            <div className="char-count">
              {formData.description.length}/500 characters
            </div>
          </div>

          {/* File Upload */}
          <div className="form-group">
            <label className="form-label">
              Upload Proof File
              <span className="required">*</span>
            </label>
            <div
              className="file-upload-area"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('drag-over');
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove('drag-over');
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('drag-over');
                const file = e.dataTransfer.files[0];
                if (file) {
                  fileInputRef.current.files = e.dataTransfer.files;
                  handleFileSelect({ target: { files: e.dataTransfer.files } });
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                disabled={uploading}
                style={{ display: 'none' }}
              />
              {formData.file ? (
                <>
                  <div className="file-icon">✓</div>
                  <p className="file-name">{formData.file.name}</p>
                  <p className="file-size">({(formData.file.size / 1024 / 1024).toFixed(2)} MB)</p>
                  <button
                    type="button"
                    className="change-file-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    Change File
                  </button>
                </>
              ) : (
                <>
                  <div className="upload-icon">📤</div>
                  <p className="upload-text">Drag and drop your file here</p>
                  <p className="upload-subtext">or click to browse</p>
                  <p className="upload-limit">Max 50MB</p>
                </>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className="info-box">
            <p><strong>📌 Important:</strong></p>
            <ul>
              <li>NGO must submit proof within 30 days of receiving the donation</li>
              <li>Proof must show actual work/items purchased with the donated funds</li>
              <li>File will be publicly verifiable on blockchain</li>
              <li>If proof is not approved, donation will be refunded to donor</li>
            </ul>
          </div>

          {/* Messages */}
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {/* Buttons */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={uploading || !formData.file}
            >
              {uploading ? '⏳ Submitting...' : '📤 Submit Proof'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProofUploadModal;
