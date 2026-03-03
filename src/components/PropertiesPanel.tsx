'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Sun,
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
  'Impact',
  'Comic Sans MS',
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
  const [showTransform, setShowTransform] = useState(true);
  const [showFill, setShowFill] = useState(true);
  const [showStroke, setShowStroke] = useState(true);
  const [showShadow, setShowShadow] = useState(false);
  const [showTypography, setShowTypography] = useState(true);
  const [showGradient, setShowGradient] = useState(false);
  const [gradientType, setGradientType] = useState<'linear' | 'radial'>('linear');
  const [gradientAngle, setGradientAngle] = useState(0);
  const [gradientColor1, setGradientColor1] = useState('#6366f1');
  const [gradientColor2, setGradientColor2] = useState('#ec4899');

  const syncProps = useCallback(() => {
    const props = canvasEngine.getSelectedObjectProperties();
    setObjProps(props);
    if (props) {
      setPosX(props.left as number || 0);
      setPosY(props.top as number || 0);
      setSizeW(props.width as number || 0);
      setSizeH(props.height as number || 0);
      setAngle(props.angle as number || 0);

      if (typeof props.fill === 'string') setFillColor(props.fill);
      if (typeof props.stroke === 'string') setStrokeColor(props.stroke);
      if (typeof props.strokeWidth === 'number') setStrokeWidth(props.strokeWidth);
      if (typeof props.opacity === 'number') setOpacity(props.opacity);
      if (typeof props.rx === 'number') setCornerRadius(props.rx);
      if (typeof props.fontSize === 'number') setFontSize(props.fontSize);
      if (typeof props.fontFamily === 'string') setFontFamily(props.fontFamily);
      if (typeof props.fontWeight === 'string') setFontWeight(props.fontWeight);
      if (typeof props.fontStyle === 'string') setFontStyle(props.fontStyle);
      if (typeof props.textAlign === 'string') setTextAlign(props.textAlign);

      if (props.shadow) {
        setShadowEnabled(true);
        const s = props.shadow as { color?: string; blur?: number; offsetX?: number; offsetY?: number };
        if (s.color) setShadowColor(s.color);
        if (typeof s.blur === 'number') setShadowBlur(s.blur);
        if (typeof s.offsetX === 'number') setShadowOffsetX(s.offsetX);
        if (typeof s.offsetY === 'number') setShadowOffsetY(s.offsetY);
      }
    }
  }, [setFillColor, setStrokeColor, setStrokeWidth, setOpacity, setCornerRadius, setFontSize, setFontFamily, setFontWeight, setFontStyle, setTextAlign, setShadowEnabled, setShadowColor, setShadowBlur, setShadowOffsetX, setShadowOffsetY]);

  useEffect(() => {
    syncProps();
  }, [selectedObjectIds, syncProps]);

  // Watch for canvas changes
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

  if (!showProperties) return null;

  const isText = objProps?.type === 'i-text' || objProps?.type === 'textbox';
  const isRect = objProps?.type === 'rect';
  const hasSelection = selectedObjectIds.length > 0;

  return (
    <div className="properties-panel">
      <div className="panel-header">
        <span>Properties</span>
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
              <span>Transform</span>
              {showTransform ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
            {showTransform && (
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
                      canvasEngine.setSelectedSize(v, sizeH);
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
                      canvasEngine.setSelectedSize(sizeW, v);
                    }}
                  />
                </div>
                <div className="prop-field">
                  <label><RotateCcw size={12} /></label>
                  <input
                    type="number"
                    value={angle}
                    onChange={(e) => {
                      const v = parseInt(e.target.value) || 0;
                      setAngle(v);
                      canvasEngine.setSelectedAngle(v);
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Fill */}
          <div className="prop-section">
            <div
              className="prop-section-header clickable"
              onClick={() => setShowFill(!showFill)}
            >
              <span>Fill</span>
              {showFill ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
            {showFill && (
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
            <div
              className="prop-section-header clickable"
              onClick={() => setShowStroke(!showStroke)}
            >
              <span>Stroke</span>
              {showStroke ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
            {showStroke && (
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
                <div className="prop-field full-width">
                  <label>Width</label>
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
              </>
            )}
          </div>

          {/* Corner Radius (rect only) */}
          {isRect && (
            <div className="prop-section">
              <div className="prop-section-header">
                <span>Corner Radius</span>
              </div>
              <div className="prop-field full-width">
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
                />
                <span className="range-value">{cornerRadius}px</span>
              </div>
            </div>
          )}

          {/* Opacity */}
          <div className="prop-section">
            <div className="prop-section-header">
              <span>Opacity</span>
            </div>
            <div className="prop-field full-width">
              <Sun size={14} />
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
              />
              <span className="range-value">{Math.round(opacity * 100)}%</span>
            </div>
          </div>

          {/* Shadow */}
          <div className="prop-section">
            <div
              className="prop-section-header clickable"
              onClick={() => setShowShadow(!showShadow)}
            >
              <span>Shadow</span>
              {showShadow ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
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
                    <span>Enable</span>
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
                    onClick={() => setGradientType('linear')}
                  >
                    Linear
                  </button>
                  <button
                    className={`icon-btn ${gradientType === 'radial' ? 'active' : ''}`}
                    onClick={() => setGradientType('radial')}
                  >
                    Radial
                  </button>
                </div>
                <div className="prop-row">
                  <ColorPicker
                    color={gradientColor1}
                    onChange={(c) => setGradientColor1(c)}
                    label="Start"
                  />
                  <ColorPicker
                    color={gradientColor2}
                    onChange={(c) => setGradientColor2(c)}
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
                      onChange={(e) => setGradientAngle(parseInt(e.target.value))}
                    />
                    <span className="range-value">{gradientAngle}&deg;</span>
                  </div>
                )}
                <button
                  className="apply-gradient-btn"
                  onClick={() => {
                    canvasEngine.setSelectedGradient(
                      gradientType,
                      [{ offset: 0, color: gradientColor1 }, { offset: 1, color: gradientColor2 }],
                      gradientAngle
                    );
                  }}
                >
                  Apply Gradient
                </button>
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
        </div>
      )}
    </div>
  );
}
