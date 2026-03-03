import '@testing-library/jest-dom'

// Mock canvas
class MockCanvas {
  getContext() {
    return {
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      getImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4) })),
      putImageData: jest.fn(),
      createImageData: jest.fn(),
      setTransform: jest.fn(),
      drawImage: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      fillText: jest.fn(),
      measureText: jest.fn(() => ({ width: 0 })),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      closePath: jest.fn(),
      stroke: jest.fn(),
      fill: jest.fn(),
      arc: jest.fn(),
      scale: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn(),
      transform: jest.fn(),
      clip: jest.fn(),
      canvas: { width: 1024, height: 768 },
    }
  }
  toDataURL() { return 'data:image/png;base64,mock' }
  width = 1024
  height = 768
}

// @ts-ignore
global.HTMLCanvasElement.prototype.getContext = function() {
  return new MockCanvas().getContext()
}
// @ts-ignore
global.HTMLCanvasElement.prototype.toDataURL = function() {
  return 'data:image/png;base64,mock'
}

// Mock window properties
Object.defineProperty(window, 'innerWidth', { value: 1024 })
Object.defineProperty(window, 'innerHeight', { value: 768 })
