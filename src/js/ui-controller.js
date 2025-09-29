export class UIController {
  constructor(meshCache, meshMaterials, scene) {
    this.meshCache = meshCache;
    this.meshMaterials = meshMaterials;
    this.scene = scene;
    this.uiContainer = null;
    this.partNames = Object.keys(meshCache);
    this.currentPartIndex = 0;
    this.currentMesh = null;
    
    // Define color palette
    this.colors = [
      { name: 'Black', hex: '#000000' },
      { name: 'Gray', hex: '#808080' },
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Cream', hex: '#F5F5DC' },
      { name: 'Olive', hex: '#6B7C59' },
      { name: 'Green', hex: '#2D5F4F' },
      { name: 'Brown', hex: '#8B4513' },
      { name: 'Gold', hex: '#DAA520' },
      { name: 'Lavender', hex: '#B4A7D6' },
      { name: 'Purple', hex: '#8B7B8B' },
      { name: 'Maroon', hex: '#800020' },
      { name: 'Blue', hex: '#4A90E2' },
      { name: 'Navy', hex: '#1E3A8A' },
      { name: 'Red', hex: '#DC143C' },
      { name: 'Orange', hex: '#FF6B35' },
    ];
    
    this.init();
  }

  init() {
    this.createUI();
    this.attachEventListeners();
    if (this.partNames.length > 0) {
      this.selectPartByIndex(0);
    }
  }

  createUI() {
    this.uiContainer = document.createElement('div');
    this.uiContainer.id = 'ui-panel';
    this.uiContainer.innerHTML = `
      <div class="carousel-container">
        <button class="carousel-btn carousel-prev" id="prev-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        
        <div class="part-info">
          <div class="part-name" id="part-name">Select Part</div>
          <div class="part-counter" id="part-counter">1/${this.partNames.length}</div>
        </div>
        
        <button class="carousel-btn carousel-next" id="next-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>

      <div class="color-palette" id="color-palette">
        ${this.colors.map((color, index) => `
          <button class="color-swatch" 
                  data-color="${color.hex}" 
                  data-index="${index}"
                  style="background-color: ${color.hex};"
                  title="${color.name}">
          </button>
        `).join('')}
      </div>
      
      <button class="reset-btn" id="reset-btn">Reset</button>
    `;

    document.body.appendChild(this.uiContainer);
    this.addStyles();
  }

  attachEventListeners() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const resetBtn = document.getElementById('reset-btn');
    const colorSwatches = document.querySelectorAll('.color-swatch');

    prevBtn.addEventListener('click', () => {
      this.navigatePart(-1);
    });

    nextBtn.addEventListener('click', () => {
      this.navigatePart(1);
    });

    resetBtn.addEventListener('click', () => {
      this.resetPart();
    });

    colorSwatches.forEach(swatch => {
      swatch.addEventListener('click', (e) => {
        const color = e.target.dataset.color;
        this.changeColor(color);
        this.setActiveColor(e.target);
      });
    });
  }

  navigatePart(direction) {
    this.currentPartIndex += direction;
    
    if (this.currentPartIndex < 0) {
      this.currentPartIndex = this.partNames.length - 1;
    } else if (this.currentPartIndex >= this.partNames.length) {
      this.currentPartIndex = 0;
    }
    
    this.selectPartByIndex(this.currentPartIndex);
  }

  selectPartByIndex(index) {
    const partName = this.partNames[index];
    this.currentMesh = this.meshCache[partName];
    
    if (this.currentMesh) {
      this.updatePartDisplay(partName, index);
      this.updateActiveColorFromMesh();
    }
  }

  updatePartDisplay(partName, index) {
    const displayName = partName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    document.getElementById('part-name').textContent = displayName;
    document.getElementById('part-counter').textContent = `${index + 1}/${this.partNames.length}`;
  }

  changeColor(hexColor) {
    if (!this.currentMesh) return;
    this.currentMesh.material.color.setStyle(hexColor);
  }

  resetPart() {
    if (!this.currentMesh || !this.currentMesh.name) return;

    const originalMaterial = this.meshMaterials[this.currentMesh.name];
    
    if (originalMaterial) {
      this.currentMesh.material.copy(originalMaterial);
      this.updateActiveColorFromMesh();
    }
  }

  updateActiveColorFromMesh() {
    if (!this.currentMesh) return;

    const currentColor = '#' + this.currentMesh.material.color.getHexString();
    const swatches = document.querySelectorAll('.color-swatch');
    
    let closestSwatch = null;
    let closestDistance = Infinity;

    swatches.forEach(swatch => {
      const swatchColor = swatch.dataset.color;
      const distance = this.colorDistance(currentColor, swatchColor);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestSwatch = swatch;
      }
    });

    if (closestSwatch) {
      this.setActiveColor(closestSwatch);
    }
  }

  setActiveColor(swatch) {
    document.querySelectorAll('.color-swatch').forEach(s => {
      s.classList.remove('active');
    });
    swatch.classList.add('active');
  }

  colorDistance(color1, color2) {
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);
    
    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);
    
    return Math.sqrt(
      Math.pow(r2 - r1, 2) +
      Math.pow(g2 - g1, 2) +
      Math.pow(b2 - b1, 2)
    );
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      * {
        box-sizing: border-box;
      }

      #ui-panel {
        position: fixed;
        bottom: 40px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(255, 255, 255, 0.98);
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
        z-index: 1000;
        backdrop-filter: blur(10px);
      }

      .carousel-container {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 24px;
      }

      .part-info {
        text-align: center;
        flex: 1;
      }

      .part-name {
        font-size: 18px;
        font-weight: 600;
        color: #111;
        margin-bottom: 4px;
      }

      .part-counter {
        font-size: 14px;
        color: #757575;
      }

      .carousel-btn {
        width: 40px;
        height: 40px;
        border: none;
        background: #f5f5f5;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        color: #111;
      }

      .carousel-btn:hover {
        background: #e5e5e5;
        transform: scale(1.05);
      }

      .carousel-btn:active {
        transform: scale(0.95);
      }

      .color-palette {
        display: flex;
        gap: 12px;
        justify-content: center;
        flex-wrap: wrap;
        margin-bottom: 20px;
        max-width: 600px;
      }

      .color-swatch {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 2px solid transparent;
        cursor: pointer;
        transition: all 0.2s;
        position: relative;
      }

      .color-swatch:hover {
        transform: scale(1.1);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .color-swatch.active {
        border-color: #111;
        box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.1);
      }

      .color-swatch.active::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 12px;
        height: 12px;
        border: 2px solid rgba(255, 255, 255, 0.8);
        border-radius: 50%;
      }

      .reset-btn {
        width: 100%;
        padding: 12px 24px;
        background: #111;
        color: white;
        border: none;
        border-radius: 24px;
        font-size: 15px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .reset-btn:hover {
        background: #333;
        transform: translateY(-1px);
      }

      .reset-btn:active {
        transform: translateY(0);
      }

      @media (max-width: 768px) {
        #ui-panel {
          bottom: 20px;
          left: 20px;
          right: 20px;
          transform: none;
          padding: 20px;
        }

        .color-palette {
          gap: 8px;
        }

        .color-swatch {
          width: 36px;
          height: 36px;
        }
      }
    `;
    document.head.appendChild(style);
  }
}