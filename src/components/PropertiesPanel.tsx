'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  FlipHorizontal2,
  FlipVertical2,
  Lock,
  Unlock,
  Download,
  Plus,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useCanvasStore } from '@/store/canvas-store';
import { canvasEngine } from '@/lib/canvas-engine';
import ColorPicker from './ColorPicker';

const fontFamilies = [
  'Inter',
  'Arial',
  'Helvetica',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Trebuchet MS',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Raleway',
  'Playfair Display',
  'Source Code Pro',
  'Fira Code',
  'Space Grotesk',
  'DM Sans',
  'JetBrains Mono',
];

const blendModes = [
  'source-over',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion',
  'hue',
  'saturation',
  'color',
  'luminosity',
];

export default function PropertiesPanel() {
  const {
    selectedObjectIds,
    fillColor, setFillColor,
    strokeColor, setStrokeColor,
    strokeWidth, setStrokeWidth,
    opacity, setOpacity,
    fontSize, setFontSize,
    fontFamily, setFontFamily,
    fontWeight, setFontWeight,
    fontStyle, setFontStyle,
    textAlign, setTextAlign,
    cornerRadius, setCornerRadius,
    shadowEnabled, setShadowEnabled,
    shadowColor, setShadowColor,
    shadowBlur, setShadowBlur,
    shadowOffsetX, setShadowOffsetX,
    shadowOffsetY, setShadowOffsetY,
    showProperties,
  } = useCanvasStore();

  const [objProps, setObjProps] = useState<Record<string, unknown> | null>(null);
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);
  const [sizeW, setSizeW] = useState(0);
  const [sizeH, setSizeH] = useState(0);
  const [angle, setAngle] = useState(0);
  const [lockAspect, setLockAspect] = useState(false);
  const [showTransform, setShowTransform] = useState(true);
  const [showFill, setShowFill] = useState(true);
  const [showStroke, setShowStroke] = useState(true);
  const [showShadow, setShowShadow] = useState(true);
  const [showTypography, setShowTypography] = useState(true);
  const [showGradient, setShowGradient] = useState(false);
  const [showAppearance, setShowAppearance] = useState(true);
  const [showExport, setShowExport] = useState(false);
  const [gradientType, setGradientType] = useState<'linear' | 'radial'>('linear');
  const [gradientAngle, setGradientAngle] = useState(0);
  const [gradientColor1, setGradientColor1] = useState('#6366f1');
  const [gradientColor2, setGradientColor2] = useState('#ec4899');

  // Typography extras
  const [lineHeight, setLineHeight] = useState(1.2);
  const [charSpacing, setCharSpacing] = useState(0);
  const [textUnderline, setTextUnderline] = useState(false);
  const [textLinethrough, setTextLinethrough] = useState(false);

  // Blend mode
  const [blendMode, setBlendMode] = useState('source-over');

  // Export settings
  const [exportScale, setExportScale] = useState(2);
  const [exportFormat, setExportFormat] = useState<'png' | 'svg'>('png');

  // Additional fills
  const [fillEnabled, setFillEnabled] = useState(true);
  const [strokeEnabled, setStrokeEnabled] = useState(true);

  const syncProps = useCallback(() => {
    const props = canvasEngine.getSelectedObjectProperties();
    setObjProps(props);
    if (props) {
      setPosX(props.left as number || 0);
      setPosY(props.top as number || 0);
      setSizeW(props.width as number || 0);
      setSizeH(props.height as number || 0);
      setAngle(props.angle as number || 0);

      if (typeof props.fill === 'string') {
        setFillColor(props.fill);
        setFillEnabled(props.fill !== 'transparent' && props.fill !== '');
      }
      if (typeof props.stroke === 'string') {
        setStrokeColor(props.stroke);
        setStrokeEnabled(!!props.stroke && props.stroke !== 'transparent');
      }
      if (typeof props.strokeWidth === 'number') setStrokeWidth(props.strokeWidth);
      if (typeof props.opacity === 'number') setOpacity(props.opacity);
      if (typeof props.rx === 'number') setCornerRadius(props.rx);
      if (typeof props.fontSize === 'number') setFontSize(props.fontSize);
      if (typeof props.fontFamily === 'string') setFontFamily(props.fontFamily);
      if (typeof props.fontWeight === 'string') setFontWeight(props.fontWeight);
      if (typeof props.fontStyle === 'string') setFontStyle(props.fontStyle);
      if (typeof props.textAlign === 'string') setTextAlign(props.textAlign);
      if (typeof props.lineHeight === 'number') setLineHeight(props.lineHeight);
      if (typeof props.charSpacing === 'number') setCharSpacing(props.charSpacing);
      if (typeof props.underline === 'boolean') setTextUnderline(props.underline);
      if (typeof props.linethrough === 'boolean') setTextLinethrough(props.linethrough);

      if (props.shadow) {
        setShadowEnabled(true);
        const s = props.shadow as { color?: string; blur?: number; offsetX?: number; offsetY?: number };
        if (s.color) setShadowColor(s.color);
        if (typeof s.blur === 'number') setShadowBlur(s.blur);
        if (typeof s.offsetX === 'number') setShadowOffsetX(s.offsetX);
        if (typeof s.offsetY === 'number') setShadowOffsetY(s.offsetY);
      } else {
        setShadowEnabled(false);
      }
    }
  }, [setFillColor, setStrokeColor, setStrokeWidth, setOpacity, setCornerRadius, setFontSize, setFontFamily, setFontWeight, setFontStyle, setTextAlign, setShadowEnabled, setShadowColor, setShadowBlur, setShadowOffsetX, setShadowOffsetY]);

  useEffect(() => {
    syncProps();
  }, [selectedObjectIds, syncProps]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedObjectIds.length > 0) {
        const props = canvasEngine.getSelectedObjectProperties();
        if (props) {
          setPosX(props.left as number || 0);
          setPosY(props.top as number || 0);
          setSizeW(props.width as number || 0);
          setSizeH(props.height as number || 0);
          setAngle(props.angle as number || 0);
        }
      }
    }, 200);
    return () => clearInterval(interval);
  }, [selectedObjectIds]);

  const handleExportSelected = () => {
    if (exportFormat === 'png') {
      const data = canvasEngine.exportSelectedToPNG(exportScale);
      const a = document.createElement('a');
      a.href = data;
      a.download = `vigma-export-${exportScale}x.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const data = canvasEngine.exportSelectedToSVG();
      const blob = new Blob([data], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vigma-export.svg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (!showProperties) return null;

  const isText = objProps?.type === 'i-text' || objProps?.type === 'textbox';
  const isRect = objProps?.type === 'rect';
  const hasSelection = selectedObjectIds.length > 0;

  return (
    <div className="properties-panel">
      <div className="panel-header">
        <span>Design</span>
      </div>

      {!hasSelection ? (
        <div className="panel-empty">
          <p>Select an object to edit its properties</p>
        </div>
      ) : (
        <div className="panel-content">
          {/* Position & Size */}
          <div className="prop-section">
            <div
              className="prop-section-header clickable"
              onClick={() => setShowTransform(!showTransform)}
            >
              <span>Position</span>
              {showTransform ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
            {showTransform && (
              <>
                <div className="prop-grid">
                  <div className="prop-field">
                    <label>X</label>
                    <input
                      type="number"
                      value={posX}
                      onChange={(e) => {
                        const v = parseInt(e.target.value) || 0;
                        setPosX(v);
                        canvasEngine.setSelectedPosition(v, posY);
                      }}
                    />
                  </div>
                  <div className="prop-field">
                    <label>Y</label>
                    <input
                      type="number"
                      value={posY}
                      onChange={(e) => {
                        const v = parseInt(e.target.value) || 0;
                        setPosY(v);
                        canvasEngine.setSelectedPosition(posX, v);
                      }}
                    />
                  </div>
                  <div className="prop-field">
                    <label>W</label>
                    <input
                      type="number"
                      value={sizeW}
                      onChange={(e) => {
                        const v = parseInt(e.target.value) || 0;
                        setSizeW(v);
                        if (lockAspect) {
                          canvasEngine.setSelectedSizeConstrained(v, sizeH, true);
                        } else {
                          canvasEngine.setSelectedSize(v, sizeH);
                        }
                      }}
                    />
                  </div>
                  <div className="prop-field">
                    <label>H</label>
                    <input
                      type="number"
                      value={sizeH}
                      onChange={(e) => {
                        const v = parseInt(e.target.value) || 0;
                        setSizeH(v);
                        if (lockAspect) {
                          canvasEngine.setSelectedSizeConstrained(sizeW, v, true);
                        } else {
                          canvasEngine.setSelectedSize(sizeW, v);
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="prop-row button-row">
                  <div className="prop-field" style={{ flex: 1 }}>
                    <label><RotateCcw size={12} /></label>
                    <input
                      type="number"
                      value={angle}
                      onChange={(e) => {
                        const v = parseInt(e.target.value) || 0;
                        setAngle(v);
                        canvasEngine.setSelectedAngle(v);
                      }}
                      style={{ width: 56 }}
                    />
                    <span className="range-value">&deg;</span>
                  </div>
                  <button
                    className={`icon-btn ${lockAspect ? 'active' : ''}`}
                    onClick={() => setLockAspect(!lockAspect)}
                    title={lockAspect ? 'Unlock Aspect Ratio' : 'Lock Aspect Ratio'}
                  >
                    {lockAspect ? <Lock size={14} /> : <Unlock size={14} />}
                  </button>
                  <button
                    className="icon-btn"
                    onClick={() => canvasEngine.flipSelectedHorizontal()}
                    title="Flip Horizontal"
                  >
                    <FlipHorizontal2 size={14} />
                  </button>
                  <button
                    className="icon-btn"
                    onClick={() => canvasEngine.flipSelectedVertical()}
                    title="Flip Vertical"
                  >
                    <FlipVertical2 size={14} />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Appearance */}
          <div className="prop-section">
            <div
              className="prop-section-header clickable"
              onClick={() => setShowAppearance(!showAppearance)}
            >
              <span>Appearance</span>
              {showAppearance ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
            {showAppearance && (
              <>
                <div className="prop-row">
                  <div className="prop-field" style={{ flex: 1 }}>
                    <label>Opacity</label>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={opacity}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setOpacity(v);
                        canvasEngine.setSelectedOpacity(v);
                      }}
                      style={{ flex: 1 }}
                    />
                    <span className="range-value">{Math.round(opacity * 100)}%</span>
                  </div>
                </div>
                {isRect && (
                  <div className="prop-row">
                    <div className="prop-field" style={{ flex: 1 }}>
                      <label>Radius</label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={cornerRadius}
                        onChange={(e) => {
                          const v = parseInt(e.target.value);
                          setCornerRadius(v);
                          canvasEngine.setSelectedCornerRadius(v);
                        }}
                        style={{ flex: 1 }}
                      />
                      <span className="range-value">{cornerRadius}px</span>
                    </div>
                  </div>
                )}
                <div className="prop-row">
                  <div className="prop-field" style={{ flex: 1 }}>
                    <label>Blend</label>
                    <select
                      value={blendMode}
                      onChange={(e) => {
                        setBlendMode(e.target.value);
                        canvasEngine.setSelectedBlendMode(e.target.value as GlobalCompositeOperation);
                      }}
                      style={{ flex: 1 }}
                    >
                      {blendModes.map((m) => (
                        <option key={m} value={m}>{m === 'source-over' ? 'Normal' : m.charAt(0).toUpperCase() + m.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Fill */}
          <div className="prop-section">
            <div className="prop-section-header clickable" onClick={() => setShowFill(!showFill)}>
              <span>Fill</span>
              <div className="section-header-actions">
                <button
                  className="section-toggle-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFillEnabled(!fillEnabled);
                    if (fillEnabled) {
                      canvasEngine.setSelectedFill('transparent');
                    } else {
                      canvasEngine.setSelectedFill(fillColor);
                    }
                  }}
                  title={fillEnabled ? 'Disable Fill' : 'Enable Fill'}
                >
                  {fillEnabled ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
                {showFill ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>
            </div>
            {showFill && fillEnabled && (
              <div className="prop-row">
                <ColorPicker
                  color={fillColor}
                  onChange={(c) => {
                    setFillColor(c);
                    canvasEngine.setSelectedFill(c);
                  }}
                />
                <span className="color-hex">{fillColor}</span>
              </div>
            )}
          </div>

          {/* Stroke */}
          <div className="prop-section">
            <div className="prop-section-header clickable" onClick={() => setShowStroke(!showStroke)}>
              <span>Stroke</span>
              <div className="section-header-actions">
                <button
                  className="section-toggle-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setStrokeEnabled(!strokeEnabled);
                    if (strokeEnabled) {
                      canvasEngine.setSelectedStroke('transparent');
                      canvasEngine.setSelectedStrokeWidth(0);
                    } else {
                      canvasEngine.setSelectedStroke(strokeColor);
                      canvasEngine.setSelectedStrokeWidth(strokeWidth || 1);
                    }
                  }}
                  title={strokeEnabled ? 'Disable Stroke' : 'Enable Stroke'}
                >
                  {strokeEnabled ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
                <button
                  className="section-toggle-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setStrokeEnabled(true);
                    canvasEngine.setSelectedStroke(strokeColor || '#000000');
                    canvasEngine.setSelectedStrokeWidth(strokeWidth || 1);
                  }}
                  title="Add Stroke"
                >
                  <Plus size={12} />
                </button>
                {showStroke ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>
            </div>
            {showStroke && strokeEnabled && (
              <>
                <div className="prop-row">
                  <ColorPicker
                    color={strokeColor}
                    onChange={(c) => {
                      setStrokeColor(c);
                      canvasEngine.setSelectedStroke(c);
                    }}
                  />
                  <span className="color-hex">{strokeColor}</span>
                </div>
                <div className="prop-grid">
                  <div className="prop-field">
                    <label>Weight</label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={strokeWidth}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value) || 0;
                        setStrokeWidth(v);
                        canvasEngine.setSelectedStrokeWidth(v);
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Effects (Shadow) */}
          <div className="prop-section">
            <div className="prop-section-header clickable" onClick={() => setShowShadow(!showShadow)}>
              <span>Effects</span>
              <div className="section-header-actions">
                <button
                  className="section-toggle-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!shadowEnabled) {
                      setShadowEnabled(true);
                      canvasEngine.setSelectedShadow({
                        color: shadowColor,
                        blur: shadowBlur,
                        offsetX: shadowOffsetX,
                        offsetY: shadowOffsetY,
                      });
                    }
                  }}
                  title="Add Effect"
                >
                  <Plus size={12} />
                </button>
                {showShadow ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>
            </div>
            {showShadow && (
              <>
                <div className="prop-row">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={shadowEnabled}
                      onChange={(e) => {
                        setShadowEnabled(e.target.checked);
                        if (e.target.checked) {
                          canvasEngine.setSelectedShadow({
                            color: shadowColor,
                            blur: shadowBlur,
                            offsetX: shadowOffsetX,
                            offsetY: shadowOffsetY,
                          });
                        } else {
                          canvasEngine.setSelectedShadow(null);
                        }
                      }}
                    />
                    <span>Drop Shadow</span>
                  </label>
                </div>
                {shadowEnabled && (
                  <>
                    <div className="prop-row">
                      <ColorPicker
                        color={shadowColor}
                        onChange={(c) => {
                          setShadowColor(c);
                          canvasEngine.setSelectedShadow({
                            color: c,
                            blur: shadowBlur,
                            offsetX: shadowOffsetX,
                            offsetY: shadowOffsetY,
                          });
                        }}
                      />
                    </div>
                    <div className="prop-grid">
                      <div className="prop-field">
                        <label>Blur</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={shadowBlur}
                          onChange={(e) => {
                            const v = parseInt(e.target.value) || 0;
                            setShadowBlur(v);
                            canvasEngine.setSelectedShadow({
                              color: shadowColor,
                              blur: v,
                              offsetX: shadowOffsetX,
                              offsetY: shadowOffsetY,
                            });
                          }}
                        />
                      </div>
                      <div className="prop-field">
                        <label>X</label>
                        <input
                          type="number"
                          value={shadowOffsetX}
                          onChange={(e) => {
                            const v = parseInt(e.target.value) || 0;
                            setShadowOffsetX(v);
                            canvasEngine.setSelectedShadow({
                              color: shadowColor,
                              blur: shadowBlur,
                              offsetX: v,
                              offsetY: shadowOffsetY,
                            });
                          }}
                        />
                      </div>
                      <div className="prop-field">
                        <label>Y</label>
                        <input
                          type="number"
                          value={shadowOffsetY}
                          onChange={(e) => {
                            const v = parseInt(e.target.value) || 0;
                            setShadowOffsetY(v);
                            canvasEngine.setSelectedShadow({
                              color: shadowColor,
                              blur: shadowBlur,
                              offsetX: shadowOffsetX,
                              offsetY: v,
                            });
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Gradient */}
          <div className="prop-section">
            <div
              className="prop-section-header clickable"
              onClick={() => setShowGradient(!showGradient)}
            >
              <span>Gradient</span>
              {showGradient ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
            {showGradient && (
              <>
                <div className="prop-row button-row">
                  <button
                    className={`icon-btn ${gradientType === 'linear' ? 'active' : ''}`}
                    onClick={() => {
                      setGradientType('linear');
                      canvasEngine.setSelectedGradient(
                        'linear',
                        [{ offset: 0, color: gradientColor1 }, { offset: 1, color: gradientColor2 }],
                        gradientAngle
                      );
                    }}
                  >
                    Linear
                  </button>
                  <button
                    className={`icon-btn ${gradientType === 'radial' ? 'active' : ''}`}
                    onClick={() => {
                      setGradientType('radial');
                      canvasEngine.setSelectedGradient(
                        'radial',
                        [{ offset: 0, color: gradientColor1 }, { offset: 1, color: gradientColor2 }],
                        gradientAngle
                      );
                    }}
                  >
                    Radial
                  </button>
                </div>
                <div className="prop-row">
                  <ColorPicker
                    color={gradientColor1}
                    onChange={(c) => {
                      setGradientColor1(c);
                      canvasEngine.setSelectedGradient(
                        gradientType,
                        [{ offset: 0, color: c }, { offset: 1, color: gradientColor2 }],
                        gradientAngle
                      );
                    }}
                    label="Start"
                  />
                  <ColorPicker
                    color={gradientColor2}
                    onChange={(c) => {
                      setGradientColor2(c);
                      canvasEngine.setSelectedGradient(
                        gradientType,
                        [{ offset: 0, color: gradientColor1 }, { offset: 1, color: c }],
                        gradientAngle
                      );
                    }}
                    label="End"
                  />
                </div>
                {gradientType === 'linear' && (
                  <div className="prop-field full-width">
                    <label>Angle</label>
                    <input
                      type="range"
                      min={0}
                      max={360}
                      value={gradientAngle}
                      onChange={(e) => {
                        const v = parseInt(e.target.value);
                        setGradientAngle(v);
                        canvasEngine.setSelectedGradient(
                          gradientType,
                          [{ offset: 0, color: gradientColor1 }, { offset: 1, color: gradientColor2 }],
                          v
                        );
                      }}
                    />
                    <span className="range-value">{gradientAngle}&deg;</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Typography (text only) */}
          {isText && (
            <div className="prop-section">
              <div
                className="prop-section-header clickable"
                onClick={() => setShowTypography(!showTypography)}
              >
                <span>Typography</span>
                {showTypography ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>
              {showTypography && (
                <>
                  <div className="prop-field full-width">
                    <label>Font</label>
                    <select
                      value={fontFamily}
                      onChange={(e) => {
                        setFontFamily(e.target.value);
                        canvasEngine.setSelectedFontFamily(e.target.value);
                      }}
                    >
                      {fontFamilies.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                  <div className="prop-grid">
                    <div className="prop-field">
                      <label>Size</label>
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={fontSize}
                        onChange={(e) => {
                          const v = parseInt(e.target.value) || 16;
                          setFontSize(v);
                          canvasEngine.setSelectedFontSize(v);
                        }}
                      />
                    </div>
                    <div className="prop-field">
                      <label>Line</label>
                      <input
                        type="number"
                        min={0.5}
                        max={5}
                        step={0.1}
                        value={lineHeight}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value) || 1.2;
                          setLineHeight(v);
                          canvasEngine.setSelectedLineHeight(v);
                        }}
                      />
                    </div>
                  </div>
                  <div className="prop-grid">
                    <div className="prop-field">
                      <label>Spacing</label>
                      <input
                        type="number"
                        min={-200}
                        max={1000}
                        value={charSpacing}
                        onChange={(e) => {
                          const v = parseInt(e.target.value) || 0;
                          setCharSpacing(v);
                          canvasEngine.setSelectedCharSpacing(v);
                        }}
                      />
                    </div>
                  </div>
                  <div className="prop-row button-row">
                    <button
                      className={`icon-btn ${fontWeight === 'bold' ? 'active' : ''}`}
                      onClick={() => {
                        const w = fontWeight === 'bold' ? 'normal' : 'bold';
                        setFontWeight(w);
                        canvasEngine.setSelectedFontWeight(w);
                      }}
                      title="Bold"
                    >
                      <Bold size={14} />
                    </button>
                    <button
                      className={`icon-btn ${fontStyle === 'italic' ? 'active' : ''}`}
                      onClick={() => {
                        const s = fontStyle === 'italic' ? 'normal' : 'italic';
                        setFontStyle(s);
                        canvasEngine.setSelectedFontStyle(s);
                      }}
                      title="Italic"
                    >
                      <Italic size={14} />
                    </button>
                    <button
                      className={`icon-btn ${textUnderline ? 'active' : ''}`}
                      onClick={() => {
                        const v = !textUnderline;
                        setTextUnderline(v);
                        canvasEngine.setSelectedUnderline(v);
                      }}
                      title="Underline"
                    >
                      <Underline size={14} />
                    </button>
                    <button
                      className={`icon-btn ${textLinethrough ? 'active' : ''}`}
                      onClick={() => {
                        const v = !textLinethrough;
                        setTextLinethrough(v);
                        canvasEngine.setSelectedLinethrough(v);
                      }}
                      title="Strikethrough"
                    >
                      <Strikethrough size={14} />
                    </button>
                    <div className="separator" />
                    <button
                      className={`icon-btn ${textAlign === 'left' ? 'active' : ''}`}
                      onClick={() => {
                        setTextAlign('left');
                        canvasEngine.setSelectedTextAlign('left');
                      }}
                      title="Align Left"
                    >
                      <AlignLeft size={14} />
                    </button>
                    <button
                      className={`icon-btn ${textAlign === 'center' ? 'active' : ''}`}
                      onClick={() => {
                        setTextAlign('center');
                        canvasEngine.setSelectedTextAlign('center');
                      }}
                      title="Align Center"
                    >
                      <AlignCenter size={14} />
                    </button>
                    <button
                      className={`icon-btn ${textAlign === 'right' ? 'active' : ''}`}
                      onClick={() => {
                        setTextAlign('right');
                        canvasEngine.setSelectedTextAlign('right');
                      }}
                      title="Align Right"
                    >
                      <AlignRight size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Export */}
          <div className="prop-section">
            <div
              className="prop-section-header clickable"
              onClick={() => setShowExport(!showExport)}
            >
              <span>Export</span>
              <div className="section-header-actions">
                <button
                  className="section-toggle-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowExport(true);
                  }}
                  title="Add Export"
                >
                  <Plus size={12} />
                </button>
                {showExport ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>
            </div>
            {showExport && (
              <>
                <div className="prop-grid">
                  <div className="prop-field">
                    <label>Scale</label>
                    <select
                      value={exportScale}
                      onChange={(e) => setExportScale(parseInt(e.target.value))}
                    >
                      <option value={1}>1x</option>
                      <option value={2}>2x</option>
                      <option value={3}>3x</option>
                      <option value={4}>4x</option>
                    </select>
                  </div>
                  <div className="prop-field">
                    <label>Format</label>
                    <select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value as 'png' | 'svg')}
                    >
                      <option value="png">PNG</option>
                      <option value="svg">SVG</option>
                    </select>
                  </div>
                </div>
                <div className="prop-row">
                  <button
                    className="apply-gradient-btn"
                    onClick={handleExportSelected}
                    style={{ width: '100%', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <Download size={14} />
                    Export Selection
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
