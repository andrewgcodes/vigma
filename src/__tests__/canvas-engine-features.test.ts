/**
 * Tests for CanvasEngine new methods (Features 101-300)
 * Tests 200 new utility methods added to CanvasEngine
 */

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

// Mock fabric
jest.mock('fabric', () => {
  const mockObj = {
    set: jest.fn().mockReturnThis(),
    get: jest.fn((prop: string) => {
      const defaults: Record<string, unknown> = { left: 100, top: 100, width: 200, height: 150, scaleX: 1, scaleY: 1, angle: 0, opacity: 1, fill: '#000', stroke: '#000', strokeWidth: 1, name: 'test', visible: true, selectable: true, lockMovementX: false, lockMovementY: false, shadow: null, flipX: false, flipY: false, originX: 'left', originY: 'top', rx: 0, ry: 0, text: 'Hello', fontSize: 16, fontFamily: 'Arial', fontWeight: 'normal', fontStyle: 'normal', underline: false, textAlign: 'left', lineHeight: 1.16, charSpacing: 0, id: 'obj1', type: 'rect' };
      return defaults[prop];
    }),
    setCoords: jest.fn(),
    clone: jest.fn((cb: Function) => cb(JSON.parse(JSON.stringify(mockObj)))),
    toJSON: jest.fn(() => ({ type: 'rect', left: 100, top: 100 })),
    toDataURL: jest.fn(() => 'data:image/png;base64,fake'),
    getBoundingRect: jest.fn(() => ({ left: 100, top: 100, width: 200, height: 150 })),
  };

  const mockCanvas = {
    add: jest.fn(),
    remove: jest.fn(),
    getObjects: jest.fn(() => [mockObj]),
    getActiveObject: jest.fn(() => mockObj),
    getActiveObjects: jest.fn(() => [mockObj]),
    setActiveObject: jest.fn(),
    discardActiveObject: jest.fn(),
    renderAll: jest.fn(),
    requestRenderAll: jest.fn(),
    getZoom: jest.fn(() => 1),
    setZoom: jest.fn(),
    getWidth: jest.fn(() => 1920),
    getHeight: jest.fn(() => 1080),
    setWidth: jest.fn(),
    setHeight: jest.fn(),
    viewportTransform: [1, 0, 0, 1, 0, 0],
    absolutePan: jest.fn(),
    relativePan: jest.fn(),
    toJSON: jest.fn(() => ({ objects: [] })),
    toDataURL: jest.fn(() => 'data:image/png;base64,fake'),
    loadFromJSON: jest.fn((_json: unknown, cb: Function) => cb()),
    on: jest.fn(),
    off: jest.fn(),
    dispose: jest.fn(),
    bringObjectToFront: jest.fn(),
    sendObjectToBack: jest.fn(),
    bringObjectForward: jest.fn(),
    sendObjectBackwards: jest.fn(),
    getCenter: jest.fn(() => ({ left: 960, top: 540 })),
    item: jest.fn(() => mockObj),
    moveTo: jest.fn(),
    clear: jest.fn(),
    _objects: [mockObj],
    isDrawingMode: false,
    freeDrawingBrush: { width: 1, color: '#000' },
    selection: true,
    backgroundColor: '#ffffff',
  };

  return {
    Canvas: jest.fn(() => mockCanvas),
    Rect: jest.fn(() => ({ ...mockObj, type: 'rect' })),
    Circle: jest.fn(() => ({ ...mockObj, type: 'circle' })),
    Ellipse: jest.fn(() => ({ ...mockObj, type: 'ellipse' })),
    Triangle: jest.fn(() => ({ ...mockObj, type: 'triangle' })),
    Line: jest.fn(() => ({ ...mockObj, type: 'line' })),
    Polyline: jest.fn(() => ({ ...mockObj, type: 'polyline' })),
    Polygon: jest.fn(() => ({ ...mockObj, type: 'polygon' })),
    Path: jest.fn(() => ({ ...mockObj, type: 'path' })),
    Group: jest.fn(() => ({ ...mockObj, type: 'group', getObjects: jest.fn(() => [mockObj]) })),
    ActiveSelection: jest.fn(() => ({ ...mockObj, type: 'activeSelection', getObjects: jest.fn(() => [mockObj]), forEachObject: jest.fn((fn: Function) => fn(mockObj)) })),
    FabricText: jest.fn(() => ({ ...mockObj, type: 'text' })),
    IText: jest.fn(() => ({ ...mockObj, type: 'i-text' })),
    Textbox: jest.fn(() => ({ ...mockObj, type: 'textbox' })),
    FabricImage: {
      fromURL: jest.fn((_url: string) => Promise.resolve({ ...mockObj, type: 'image' })),
      filters: {},
    },
    Shadow: jest.fn(() => ({ color: '#000', blur: 5, offsetX: 2, offsetY: 2 })),
    Point: jest.fn((x: number, y: number) => ({ x, y })),
    Gradient: jest.fn(() => ({})),
    Pattern: jest.fn(() => ({})),
    FabricObject: { prototype: { set: jest.fn() } },
    PencilBrush: jest.fn(() => ({ width: 1, color: '#000' })),
    CircleBrush: jest.fn(() => ({ width: 1, color: '#000' })),
    SprayBrush: jest.fn(() => ({ width: 1, color: '#000' })),
    util: {
      degreesToRadians: jest.fn((d: number) => d * Math.PI / 180),
      radiansToDegrees: jest.fn((r: number) => r * 180 / Math.PI),
      transformPoint: jest.fn((_p: unknown) => ({ x: 0, y: 0 })),
    },
  };
});

import { CanvasEngine } from '@/lib/canvasEngine';

describe('CanvasEngine - Features 101-300', () => {
  let engine: CanvasEngine;
  const mockCallbacks = {
    onSelectionChange: jest.fn(),
    onObjectModified: jest.fn(),
    onHistoryChange: jest.fn(),
    onZoomChange: jest.fn(),
    onViewportChange: jest.fn(),
  };

  beforeEach(() => {
    // Create a mock canvas element
    const canvasEl = document.createElement('canvas');
    engine = new CanvasEngine(canvasEl, mockCallbacks);
    jest.clearAllMocks();
  });

  // Features 101-110: Centering & matching
  describe('Features 101-110: Centering & matching', () => {
    const methods = [
      'centerHorizontally', 'centerVertically', 'matchWidth', 'matchHeight',
      'matchSize', 'centerOnCanvas', 'centerX', 'centerY',
      'alignToPageCenter', 'moveToCenter'
    ];
    methods.forEach(method => {
      it(`should have ${method} method`, () => {
        expect(typeof (engine as any)[method]).toBe('function');
      });
    });
  });

  // Features 111-130: Transform & spacing
  describe('Features 111-130: Transform & spacing', () => {
    const methods = [
      'rotateBy', 'scaleBy', 'moveBy', 'setObjectPosition',
      'setObjectSize', 'spacingEqual', 'stackVertically', 'stackHorizontally',
      'randomizePositions', 'randomizeColors', 'arrangeInGrid', 'arrangeInCircle',
      'swapPositions', 'flipHorizontal', 'flipVertical',
      'skewX', 'skewY', 'resetTransforms', 'constrainProportions', 'makeSquare'
    ];
    methods.forEach(method => {
      it(`should have ${method} method`, () => {
        expect(typeof (engine as any)[method]).toBe('function');
      });
    });
  });

  // Features 131-150: Shape creation
  describe('Features 131-150: Shape creation', () => {
    const methods = [
      'addStar', 'addArrow', 'addHeart', 'addPolygon', 'addCross',
      'addDiamond', 'addOctagon', 'addPentagon', 'addCloud', 'addSpeechBubble',
      'addConnector', 'addCallout', 'addBadge', 'addStickyNote', 'addRoundedRect',
      'addSquare', 'addHorizontalLine', 'addVerticalLine', 'addPieSlice', 'addChip'
    ];
    methods.forEach(method => {
      it(`should have ${method} method`, () => {
        expect(typeof (engine as any)[method]).toBe('function');
      });
    });
  });

  // Features 151-170: Text & styling
  describe('Features 151-170: Text & styling', () => {
    const methods = [
      'addHeading', 'addSubheading', 'addBodyText', 'addCaption',
      'textToUpperCase', 'textToLowerCase', 'textToTitleCase',
      'toggleBold', 'toggleItalic', 'toggleUnderline', 'toggleStrikethrough',
      'increaseFontSize', 'decreaseFontSize', 'setFontFamily', 'setTextAlign',
      'setLineHeight', 'setCharSpacing', 'setCornerRadius', 'setIndividualCornerRadius',
      'addTextLink'
    ];
    methods.forEach(method => {
      it(`should have ${method} method`, () => {
        expect(typeof (engine as any)[method]).toBe('function');
      });
    });
  });

  // Features 171-190: Canvas operations
  describe('Features 171-190: Canvas operations', () => {
    const methods = [
      'getCanvasStatistics', 'getObjectById', 'findObjectsByName', 'selectByType',
      'selectByFill', 'selectByStroke', 'selectByName', 'lockObject',
      'unlockAllObjects', 'showAllObjects', 'toggleVisibility',
      'setObjectName', 'renameObject', 'countObjectsByType',
      'getAllObjectNames', 'getAllObjectIds', 'selectAll', 'deselectAll',
      'invertSelection', 'groupSelected'
    ];
    methods.forEach(method => {
      it(`should have ${method} method`, () => {
        expect(typeof (engine as any)[method]).toBe('function');
      });
    });
  });

  // Features 191-210: Export & clipboard
  describe('Features 191-210: Export & clipboard', () => {
    const methods = [
      'exportToWebP', 'exportToJPG', 'exportToPNG', 'exportToSVG',
      'exportToJSON', 'exportSelectedToPNG', 'exportSelectedToJPG',
      'exportSelectedToSVG', 'exportAtResolution', 'exportVisibleOnly',
      'generateCodeExport', 'getCanvasJSON', 'getCanvasSize', 'setCanvasSize',
      'getCanvasBackgroundColor', 'setCanvasBackgroundColor',
      'ungroupSelected', 'selectMultipleByIds', 'selectObjectById', 'panToObjectById'
    ];
    methods.forEach(method => {
      it(`should have ${method} method`, () => {
        expect(typeof (engine as any)[method]).toBe('function');
      });
    });
  });

  // Features 211-230: Object property methods
  describe('Features 211-230: Object property methods', () => {
    const methods = [
      'setObjectFill', 'setObjectStroke', 'setObjectOpacity', 'setObjectShadow',
      'setObjectGradient', 'setObjectRotation', 'setObjectSkewX', 'setObjectSkewY',
      'setBlendMode', 'setObjectStrokeDash', 'setDashedStroke', 'setDottedStroke',
      'setSolidStroke', 'setStrokeLineCap', 'setStrokeLineJoin', 'setStrokePosition',
      'removeFill', 'removeStroke', 'removeShadow', 'setFillAndStroke'
    ];
    methods.forEach(method => {
      it(`should have ${method} method`, () => {
        expect(typeof (engine as any)[method]).toBe('function');
      });
    });
  });

  // Features 231-250: Advanced operations
  describe('Features 231-250: Advanced operations', () => {
    const methods = [
      'applyMask', 'removeMask', 'cropImage', 'resetCrop',
      'booleanUnion', 'booleanSubtract', 'booleanIntersect', 'booleanExclude',
      'addLabelToSelected', 'flattenRotation', 'pinToCorner',
      'outlineStroke', 'applyUniformFill', 'applyUniformStroke', 'setUniformOpacity',
      'scaleToFitCanvas', 'scaleToWidth', 'scaleToHeight', 'fitInBox', 'doubleSize'
    ];
    methods.forEach(method => {
      it(`should have ${method} method`, () => {
        expect(typeof (engine as any)[method]).toBe('function');
      });
    });
  });

  // Features 251-270: UI component shapes
  describe('Features 251-270: UI component shapes', () => {
    const methods = [
      'addButton', 'addInputField', 'addCheckbox', 'addRadioButton',
      'addDropdown', 'addToggleSwitch', 'addProgressBar', 'addNavBar',
      'addTabBar', 'addCard', 'addHeaderBar', 'addFooter',
      'addSidebar', 'addModalOverlay', 'addTooltip', 'addListItem',
      'addImagePlaceholder', 'addAvatarPlaceholder', 'addIconButton', 'addDivider'
    ];
    methods.forEach(method => {
      it(`should have ${method} method`, () => {
        expect(typeof (engine as any)[method]).toBe('function');
      });
    });
  });

  // Features 271-290: More shapes and utilities
  describe('Features 271-290: More shapes and utilities', () => {
    const methods = [
      'addSkeleton', 'addBreadcrumb', 'addStepIndicator', 'addStatDisplay',
      'addPricingCard', 'addFeatureCard', 'addTestimonialCard', 'addProfileCard',
      'addHeroSection', 'addFormLayout', 'addWireframeLayout', 'addWireframeRect',
      'addNotificationBadge', 'addStatusDot', 'addStarRating', 'addColorSwatch',
      'addColorPalette', 'addCodeBlock', 'addBlockquote', 'addSectionHeading'
    ];
    methods.forEach(method => {
      it(`should have ${method} method`, () => {
        expect(typeof (engine as any)[method]).toBe('function');
      });
    });
  });

  // Features 291-300: Final batch
  describe('Features 291-300: Remaining methods', () => {
    const methods = [
      'addAlertBanner', 'addLoadingSpinner', 'addOrderedList', 'addUnorderedList',
      'addTableGrid', 'halveSize', 'getObjectCount', 'getObjectsList',
      'sortByPosition', 'reverseLayerOrder'
    ];
    methods.forEach(method => {
      it(`should have ${method} method`, () => {
        expect(typeof (engine as any)[method]).toBe('function');
      });
    });
  });
});
