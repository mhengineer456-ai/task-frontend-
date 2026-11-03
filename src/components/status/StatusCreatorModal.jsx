import React, { useState, useRef } from 'react';
import { useTaskContext } from '../../context/TaskContext';
import {
  X,
  Type,
  Image as ImageIcon,
  Video as VideoIcon,
  Send,
  Sparkles,
  Palette,
  Shield,
  Upload,
  Check,
  AlertCircle,
  Play,
  Pause
} from 'lucide-react';
import StatusPrivacyModal from './StatusPrivacyModal';

const APPLE_PALETTES = [
  { id: 'apple-blue', color: '#007AFF', label: 'Apple Blue' },
  { id: 'indigo', color: '#5856D6', label: 'Electric Indigo' },
  { id: 'violet', color: '#AF52DE', label: 'Royal Violet' },
  { id: 'coral', color: '#FF9500', label: 'Sunset Coral' },
  { id: 'crimson', color: '#FF3B30', label: 'Crimson' },
  { id: 'mint', color: '#34C759', label: 'Emerald Mint' },
  { id: 'slate', color: '#1C1C1E', label: 'Deep Charcoal' },
  { id: 'teal', color: '#30B0C7', label: 'Cyan Ocean' },
  { id: 'dark-gradient', color: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)', label: 'Dark Zinc' },
  { id: 'blue-gradient', color: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)', label: 'Apple Aurora' }
];

const FONT_STYLES = [
  { id: 'sans', name: 'Sans', font: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', weight: '700' },
  { id: 'serif', name: 'Serif', font: 'Georgia, Cambria, "Times New Roman", serif', weight: '600' },
  { id: 'mono', name: 'Mono', font: '"SF Mono", "Fira Code", monospace', weight: '700' },
  { id: 'display', name: 'Display', font: 'Impact, "Arial Black", sans-serif', weight: '900' },
  { id: 'script', name: 'Casual', font: '"Comic Sans MS", "Caveat", cursive', weight: '700' }
];

export default function StatusCreatorModal({ isOpen, onClose }) {
  const {
    publishStatus,
    statusPrivacy = { privacyType: 'contacts' }
  } = useTaskContext();

  const [activeTab, setActiveTab] = useState('text'); // 'text' | 'image' | 'video'
  const [textContent, setTextContent] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#007AFF');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [fontStyleId, setFontStyleId] = useState('sans');

  const [selectedImage, setSelectedImage] = useState(null); // { dataUrl, file, name, size }
  const [selectedVideo, setSelectedVideo] = useState(null); // { dataUrl, file, name, size, duration }
  const [caption, setCaption] = useState('');
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  if (!isOpen) return null;

  const currentFont = FONT_STYLES.find(f => f.id === fontStyleId) || FONT_STYLES[0];

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPEG, PNG, WebP)');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 15MB limit. Please choose a smaller image.');
      return;
    }

    setErrorMessage('');
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage({
        dataUrl: event.target.result,
        name: file.name,
        size: Math.round(file.size / 1024)
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleVideoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg'];
    if (!validVideoTypes.includes(file.type)) {
      setErrorMessage('Please select a supported video format (MP4, WebM, QuickTime MOV)');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('Video size exceeds 25MB limit. Please select a shorter video clip.');
      return;
    }

    setErrorMessage('');
    setUploadProgress(35);
    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        setUploadProgress(Math.round((event.loaded / event.total) * 90));
      }
    };
    reader.onload = (event) => {
      setUploadProgress(100);
      setSelectedVideo({
        dataUrl: event.target.result,
        name: file.name,
        size: Math.round(file.size / (1024 * 1024))
      });
      setTimeout(() => setUploadProgress(0), 400);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const canPublish = () => {
    if (activeTab === 'text') return textContent.trim().length > 0;
    if (activeTab === 'image') return !!selectedImage?.dataUrl;
    if (activeTab === 'video') return !!selectedVideo?.dataUrl;
    return false;
  };

  const handlePublish = async () => {
    if (!canPublish() || isPublishing) return;
    setIsPublishing(true);
    setErrorMessage('');

    try {
      if (activeTab === 'text') {
        await publishStatus({
          type: 'text',
          content: textContent.trim(),
          mediaUrl: null,
          backgroundColor,
          textColor,
          fontStyle: fontStyleId,
          privacyType: statusPrivacy.privacyType,
          privacyUsers: statusPrivacy.privacyType === 'except' ? statusPrivacy.excludedUsers : statusPrivacy.allowedUsers
        });
      } else if (activeTab === 'image') {
        await publishStatus({
          type: 'image',
          content: caption.trim(),
          mediaUrl: selectedImage.dataUrl,
          backgroundColor: '#000000',
          textColor: '#FFFFFF',
          fontStyle: 'sans',
          privacyType: statusPrivacy.privacyType,
          privacyUsers: statusPrivacy.privacyType === 'except' ? statusPrivacy.excludedUsers : statusPrivacy.allowedUsers
        });
      } else if (activeTab === 'video') {
        await publishStatus({
          type: 'video',
          content: caption.trim(),
          mediaUrl: selectedVideo.dataUrl,
          backgroundColor: '#000000',
          textColor: '#FFFFFF',
          fontStyle: 'sans',
          privacyType: statusPrivacy.privacyType,
          privacyUsers: statusPrivacy.privacyType === 'except' ? statusPrivacy.excludedUsers : statusPrivacy.allowedUsers
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to publish status. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  const getPrivacyLabel = () => {
    if (statusPrivacy.privacyType === 'except') {
      return `My Contacts Except (${statusPrivacy.excludedUsers?.length || 0})`;
    }
    if (statusPrivacy.privacyType === 'only') {
      return `Only Share With (${statusPrivacy.allowedUsers?.length || 0})`;
    }
    return 'My Contacts';
  };

  return (
    <>
      <div
        className="modal-overlay"
        onClick={onClose}
        style={{
          zIndex: 105000,
          background: 'rgba(0, 0, 0, 0.72)',
          backdropFilter: 'blur(18px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}
      >
        <div
          className="modal-container status-creator-modal"
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '520px',
            background: 'var(--bg-card)',
            borderRadius: '24px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '92vh',
            animation: 'scaleUpModal 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Top Bar: Title & Mode Selector */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-sidebar)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--brand-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles style={{ width: '17px', height: '17px' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Create Status
                </h3>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                  Active for 24 hours
                </span>
              </div>
            </div>

            {/* Apple Segmented Mode Switcher */}
            <div style={{ display: 'flex', background: 'var(--bg-input)', padding: '3px', borderRadius: '12px', border: '1px solid var(--border-color)', gap: '2px' }}>
              <button
                type="button"
                onClick={() => { setActiveTab('text'); setErrorMessage(''); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 10px',
                  borderRadius: '9px',
                  border: 'none',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: activeTab === 'text' ? 'var(--brand-primary)' : 'transparent',
                  color: activeTab === 'text' ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Type style={{ width: '13px', height: '13px' }} />
                <span>Text</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('image'); setErrorMessage(''); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 10px',
                  borderRadius: '9px',
                  border: 'none',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: activeTab === 'image' ? 'var(--brand-primary)' : 'transparent',
                  color: activeTab === 'image' ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
              >
                <ImageIcon style={{ width: '13px', height: '13px' }} />
                <span>Photo</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('video'); setErrorMessage(''); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 10px',
                  borderRadius: '9px',
                  border: 'none',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: activeTab === 'video' ? 'var(--brand-primary)' : 'transparent',
                  color: activeTab === 'video' ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
              >
                <VideoIcon style={{ width: '13px', height: '13px' }} />
                <span>Video</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '50%', display: 'flex' }}
            >
              <X style={{ width: '18px', height: '18px' }} />
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div style={{ padding: '8px 16px', background: 'rgba(255, 59, 48, 0.1)', color: '#FF3B30', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255, 59, 48, 0.2)' }}>
              <AlertCircle style={{ width: '14px', height: '14px', flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Interactive Workspace Area */}
          <div style={{ padding: '16px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* TAB 1: TEXT STATUS */}
            {activeTab === 'text' && (
              <>
                {/* Live Card Preview & Interactive Editor */}
                <div
                  style={{
                    height: '240px',
                    borderRadius: '16px',
                    background: backgroundColor,
                    color: textColor,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px',
                    boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.2), 0 10px 25px rgba(0, 0, 0, 0.15)',
                    position: 'relative',
                    transition: 'background 0.3s ease'
                  }}
                >
                  <textarea
                    placeholder="Type a status update..."
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    maxLength={350}
                    autoFocus
                    style={{
                      width: '100%',
                      height: '100%',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: textColor,
                      fontFamily: currentFont.font,
                      fontWeight: currentFont.weight,
                      fontSize: textContent.length > 100 ? '1.15rem' : textContent.length > 50 ? '1.35rem' : '1.65rem',
                      textAlign: 'center',
                      resize: 'none',
                      lineHeight: '1.4'
                    }}
                  />
                  <div style={{ position: 'absolute', bottom: '8px', right: '12px', fontSize: '0.68rem', color: textColor, opacity: 0.75, fontWeight: 700 }}>
                    {textContent.length}/350
                  </div>
                </div>

                {/* Typography Styler */}
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                    Typography Style
                  </div>
                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {FONT_STYLES.map(style => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setFontStyleId(style.id)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '10px',
                          border: fontStyleId === style.id ? '1.5px solid var(--brand-primary)' : '1px solid var(--border-color)',
                          background: fontStyleId === style.id ? 'var(--brand-glow)' : 'var(--bg-input)',
                          color: fontStyleId === style.id ? 'var(--brand-primary)' : 'var(--text-primary)',
                          fontFamily: style.font,
                          fontWeight: style.weight,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {style.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Palettes */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Background Colors
                    </span>
                    <button
                      type="button"
                      onClick={() => setTextColor(prev => prev === '#FFFFFF' ? '#171717' : '#FFFFFF')}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: 'var(--brand-primary)',
                        cursor: 'pointer'
                      }}
                    >
                      Text: {textColor === '#FFFFFF' ? 'White' : 'Charcoal'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {APPLE_PALETTES.map(p => (
                      <div
                        key={p.id}
                        onClick={() => setBackgroundColor(p.color)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: p.color,
                          cursor: 'pointer',
                          border: backgroundColor === p.color ? '3px solid #FFFFFF' : '1px solid rgba(0, 0, 0, 0.1)',
                          boxShadow: backgroundColor === p.color ? '0 0 0 2px var(--brand-primary)' : 'none',
                          flexShrink: 0,
                          transition: 'transform 0.15s ease'
                        }}
                        title={p.label}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* TAB 2: PHOTO STATUS */}
            {activeTab === 'image' && (
              <>
                <input
                  type="file"
                  accept="image/*"
                  ref={imageInputRef}
                  onChange={handleImageFileChange}
                  style={{ display: 'none' }}
                />

                {!selectedImage ? (
                  <div
                    onClick={() => imageInputRef.current?.click()}
                    style={{
                      height: '240px',
                      borderRadius: '16px',
                      border: '2px dashed var(--border-color)',
                      background: 'var(--bg-input)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      gap: '10px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
                      <Upload style={{ width: '22px', height: '22px' }} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Select a Photo to Upload
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Supports JPG, PNG, WebP up to 15MB
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', height: '240px', background: '#000' }}>
                    <img
                      src={selectedImage.dataUrl}
                      alt="Status Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedImage(null)}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'rgba(0, 0, 0, 0.65)',
                        border: 'none',
                        color: '#fff',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Remove Photo"
                    >
                      <X style={{ width: '16px', height: '16px' }} />
                    </button>
                  </div>
                )}

                {/* Caption Input */}
                <div>
                  <input
                    type="text"
                    placeholder="Add a photo caption..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    maxLength={140}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.86rem',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </>
            )}

            {/* TAB 3: VIDEO STATUS */}
            {activeTab === 'video' && (
              <>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/ogg"
                  ref={videoInputRef}
                  onChange={handleVideoFileChange}
                  style={{ display: 'none' }}
                />

                {!selectedVideo ? (
                  <div
                    onClick={() => videoInputRef.current?.click()}
                    style={{
                      height: '240px',
                      borderRadius: '16px',
                      border: '2px dashed var(--border-color)',
                      background: 'var(--bg-input)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      gap: '10px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
                      <VideoIcon style={{ width: '22px', height: '22px' }} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Select a Short Video Clip
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Supports MP4, WebM, MOV up to 25MB
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', height: '240px', background: '#000' }}>
                    <video
                      src={selectedVideo.dataUrl}
                      controls
                      autoPlay
                      loop
                      playsInline
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedVideo(null)}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'rgba(0, 0, 0, 0.65)',
                        border: 'none',
                        color: '#fff',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10
                      }}
                      title="Remove Video"
                    >
                      <X style={{ width: '16px', height: '16px' }} />
                    </button>
                  </div>
                )}

                {/* Upload Progress Bar if processing */}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div style={{ width: '100%', background: 'var(--bg-input)', borderRadius: '99px', height: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--brand-primary)', transition: 'width 0.2s ease' }} />
                  </div>
                )}

                {/* Caption Input */}
                <div>
                  <input
                    type="text"
                    placeholder="Add a video caption..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    maxLength={140}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.86rem',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </>
            )}
          </div>

          {/* Bottom Bar: Privacy & Prominent Publish Button */}
          <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-sidebar)' }}>
            {/* Privacy Selector Pill */}
            <button
              type="button"
              onClick={() => setIsPrivacyModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '12px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontSize: '0.74rem',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Change status privacy"
            >
              <Shield style={{ width: '13px', height: '13px', color: 'var(--brand-primary)' }} />
              <span>{getPrivacyLabel()}</span>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>▾</span>
            </button>

            {/* Prominent Publish Button */}
            <button
              type="button"
              onClick={handlePublish}
              disabled={!canPublish() || isPublishing}
              className="apple-circle-action-btn"
              style={{
                borderRadius: '14px',
                width: 'auto',
                minWidth: '130px',
                height: '40px',
                padding: '0 18px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '0.82rem',
                fontWeight: 800,
                opacity: canPublish() && !isPublishing ? 1 : 0.45,
                cursor: canPublish() && !isPublishing ? 'pointer' : 'not-allowed'
              }}
            >
              {isPublishing ? (
                <span>Publishing...</span>
              ) : (
                <>
                  <Send style={{ width: '15px', height: '15px' }} />
                  <span>Publish</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Nested Status Privacy Modal */}
      {isPrivacyModalOpen && (
        <StatusPrivacyModal
          isOpen={isPrivacyModalOpen}
          onClose={() => setIsPrivacyModalOpen(false)}
        />
      )}
    </>
  );
}
