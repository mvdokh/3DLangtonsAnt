class LangtonsAntSimulation {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 200;
        this.cellSize = 3;
        this.zoomLevel = 3;
        this.viewportX = 0;
        this.viewportY = 0;
        this.isRunning = false;
        this.stepCounter = 0;
        this.fps = 10;
        this.stepsPerFrame = 1;
        this.animationId = null;
        
        // Performance optimizations
        this.imageData = null;
        this.pixelData = null;
        this.dirtyRegions = new Set();
        this.lastRenderTime = 0;
        this.performanceMode = 'normal';
        this.renderSkipCounter = 0;
        this.actualZoom = 1;
        
        // Initialize grid and ants
        this.grid = [];
        this.ants = [];
        this.rules = 'RL';
        this.antType = 'langton';
        
        // Color palettes for different rules
        this.colorPalettes = {
            'RL': ['#000000', '#FFFFFF'],
            'RLR': ['#000000', '#FF0000', '#FFFFFF'],
            'LLRR': ['#000000', '#FF0000', '#00FF00', '#FFFFFF'],
            'LRRRRRLLR': ['#000000', '#FF0000', '#FF8000', '#FFFF00', '#80FF00', '#00FF00', '#00FF80', '#00FFFF', '#0080FF', '#FFFFFF'],
            'LLRRRLRLRLLR': Array.from({length: 12}, (_, i) => this.getColorFromHue(i * 30)),
            'RRLLLRLLLRRR': Array.from({length: 12}, (_, i) => this.getColorFromHue(i * 30)),
            'L2NNL1L2L1': ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'],
            'L1L2NUL2L1R2': ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF'],
            'R1R2NUR2R1L2': ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF']
        };
        
        this.turmiteRules = {
            turmite1: {
                states: 2,
                transitions: [
                    // state 0
                    [{write: 1, turn: 'R', nextState: 1}, {write: 1, turn: 'R', nextState: 1}],
                    // state 1
                    [{write: 0, turn: 'L', nextState: 0}, {write: 0, turn: 'L', nextState: 0}]
                ]
            },
            turmite2: {
                states: 3,
                transitions: [
                    [{write: 1, turn: 'R', nextState: 1}, {write: 2, turn: 'L', nextState: 2}],
                    [{write: 2, turn: 'L', nextState: 2}, {write: 0, turn: 'R', nextState: 0}],
                    [{write: 0, turn: 'R', nextState: 0}, {write: 1, turn: 'L', nextState: 1}]
                ]
            },
            turmite3: {
                states: 2,
                transitions: [
                    [{write: 1, turn: 'R', nextState: 0}, {write: 0, turn: 'L', nextState: 1}],
                    [{write: 2, turn: 'L', nextState: 0}, {write: 1, turn: 'R', nextState: 1}]
                ]
            },
            turmite4: {
                states: 4,
                transitions: [
                    [{write: 1, turn: 'R', nextState: 1}, {write: 2, turn: 'L', nextState: 3}],
                    [{write: 2, turn: 'L', nextState: 2}, {write: 3, turn: 'R', nextState: 0}],
                    [{write: 3, turn: 'R', nextState: 3}, {write: 0, turn: 'L', nextState: 1}],
                    [{write: 0, turn: 'L', nextState: 0}, {write: 1, turn: 'R', nextState: 2}]
                ]
            }
        };
        
        this.initializeCanvas();
        this.initializeGrid();
        this.initializeControls();
        this.reset();
    }
    
    getColorFromHue(hue) {
        const c = this.hslToRgb(hue / 360, 0.8, 0.6);
        return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
    }
    
    hslToRgb(h, s, l) {
        let r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }
    
    initializeCanvas() {
        this.resizeCanvas();
        this.ctx.imageSmoothingEnabled = false;
        
        // Add resize listener
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.render();
        });
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Initialize ImageData for faster rendering
        this.imageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
        this.pixelData = this.imageData.data;
        
        // Always center the viewport on the grid center
        this.centerView();
    }
    
    centerView() {
        // Calculate zoom level to fit the entire grid on screen at 1x
        const maxZoomX = this.canvas.width / this.gridSize;
        const maxZoomY = this.canvas.height / this.gridSize;
        const baseZoom = Math.min(maxZoomX, maxZoomY);
        
        // Apply the user's zoom multiplier to the base zoom
        const actualZoom = baseZoom * this.zoomLevel;
        
        this.viewportX = (this.gridSize * actualZoom - this.canvas.width) / 2;
        this.viewportY = (this.gridSize * actualZoom - this.canvas.height) / 2;
        
        // Store the actual zoom for rendering
        this.actualZoom = actualZoom;
    }
    
    initializeGrid() {
        this.grid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(0));
    }
    
    initializeControls() {
        // Controls panel toggle
        const trigger = document.getElementById('controls-trigger');
        const panel = document.getElementById('controls-panel');
        const closeBtn = document.getElementById('close-controls');
        
        trigger.addEventListener('click', () => {
            panel.classList.toggle('hidden');
        });
        
        closeBtn.addEventListener('click', () => {
            panel.classList.add('hidden');
        });
        
        // Control inputs
        document.getElementById('num-ants').addEventListener('change', (e) => {
            this.reset();
            this.autoStartSimulation();
        });
        
        document.getElementById('speed').addEventListener('input', (e) => {
            this.fps = parseInt(e.target.value);
            document.getElementById('speed-value').textContent = this.fps;
            // No need to restart animation, it will pick up the new FPS automatically
        });
        
        document.getElementById('steps-per-frame').addEventListener('input', (e) => {
            this.stepsPerFrame = parseInt(e.target.value);
            document.getElementById('steps-value').textContent = this.stepsPerFrame;
        });
        
        document.getElementById('zoom-level').addEventListener('input', (e) => {
            this.zoomLevel = parseFloat(e.target.value);
            document.getElementById('zoom-value').textContent = this.zoomLevel + 'x';
            this.centerView();
            this.render();
        });
        
        document.getElementById('performance-mode').addEventListener('change', (e) => {
            this.performanceMode = e.target.value;
            this.render();
        });
        
        document.getElementById('rule-preset').addEventListener('change', (e) => {
            const customGroup = document.getElementById('custom-rule-group');
            if (e.target.value === 'custom') {
                customGroup.style.display = 'block';
            } else {
                customGroup.style.display = 'none';
                this.rules = e.target.value;
                this.reset();
                this.autoStartSimulation();
            }
        });
        
        document.getElementById('custom-rule').addEventListener('change', (e) => {
            this.rules = e.target.value || 'RL';
            this.reset();
            this.autoStartSimulation();
        });
        
        document.getElementById('ant-type').addEventListener('change', (e) => {
            this.antType = e.target.value;
            this.reset();
            this.autoStartSimulation();
        });
        
        document.getElementById('start-pause').addEventListener('click', () => {
            this.toggleSimulation();
        });
        
        document.getElementById('reset').addEventListener('click', () => {
            this.reset();
        });
        
        document.getElementById('step').addEventListener('click', () => {
            if (!this.isRunning) {
                this.step();
                this.render();
            }
        });
        
        // Canvas click to add ants
        this.canvas.addEventListener('click', (e) => {
            if (!this.isRunning) {
                const rect = this.canvas.getBoundingClientRect();
                const x = Math.floor((e.clientX - rect.left + this.viewportX) / this.actualZoom);
                const y = Math.floor((e.clientY - rect.top + this.viewportY) / this.actualZoom);
                this.addAnt(x, y);
                this.render();
            }
        });
        
        // Mouse wheel zooming (centered)
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            // Update zoom
            const zoomChange = e.deltaY > 0 ? -0.5 : 0.5;
            this.zoomLevel = Math.max(0.5, Math.min(20, this.zoomLevel + zoomChange));
            
            // Update the zoom display
            document.getElementById('zoom-level').value = this.zoomLevel;
            document.getElementById('zoom-value').textContent = this.zoomLevel + 'x';
            
            // Always center the view
            this.centerView();
            this.render();
        });
    }
    
    addAnt(x, y, direction = 0, state = 0) {
        if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
            this.ants.push({
                x: x,
                y: y,
                direction: direction, // 0: North, 1: East, 2: South, 3: West
                state: state, // For turmites
                active: true
            });
            this.updateAntCounter();
        }
    }
    
    autoStartSimulation() {
        if (!this.isRunning) {
            setTimeout(() => {
                this.isRunning = true;
                const button = document.getElementById('start-pause');
                button.textContent = 'Pause';
                button.classList.add('running');
                this.animate();
            }, 100); // Small delay to ensure UI is updated
        }
    }
    
    reset() {
        this.isRunning = false;
        this.stepCounter = 0;
        this.ants = [];
        this.initializeGrid();
        
        const numAnts = parseInt(document.getElementById('num-ants').value);
        const centerX = Math.floor(this.gridSize / 2);
        const centerY = Math.floor(this.gridSize / 2);
        
        // Add ants in a small circle around center
        for (let i = 0; i < numAnts; i++) {
            const angle = (i / numAnts) * 2 * Math.PI;
            const radius = Math.min(5, numAnts);
            const x = centerX + Math.floor(Math.cos(angle) * radius);
            const y = centerY + Math.floor(Math.sin(angle) * radius);
            this.addAnt(x, y, i % 4);
        }
        
        // Center the view on the grid
        this.centerView();
        this.updateUI();
        this.render();
        
        // Stop animation if running
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    step() {
        this.ants.forEach(ant => {
            if (!ant.active) return;
            
            if (this.antType === 'langton') {
                this.stepLangtonAnt(ant);
            } else {
                this.stepTurmite(ant);
            }
        });
        
        this.stepCounter++;
        this.updateStepCounter();
    }
    
    stepLangtonAnt(ant) {
        const currentCell = this.grid[ant.y][ant.x];
        const ruleIndex = currentCell % this.rules.length;
        const rule = this.rules[ruleIndex];
        
        // Handle extended rules with numbers and special characters
        let turn = 'N'; // No turn
        if (rule === 'L' || rule === 'L1') {
            turn = 'L';
        } else if (rule === 'R' || rule === 'R1') {
            turn = 'R';
        } else if (rule === 'L2') {
            turn = 'LL'; // Turn left twice
        } else if (rule === 'R2') {
            turn = 'RR'; // Turn right twice
        } else if (rule === 'N') {
            turn = 'N'; // No turn
        } else if (rule === 'U') {
            turn = 'U'; // U-turn (180 degrees)
        }
        
        // Update cell color
        this.grid[ant.y][ant.x] = (currentCell + 1) % this.rules.length;
        
        // Turn the ant
        this.turnAnt(ant, turn);
        
        // Move the ant forward
        this.moveAnt(ant);
    }
    
    stepTurmite(ant) {
        const turmiteRule = this.turmiteRules[this.antType];
        if (!turmiteRule) return;
        
        const currentCell = this.grid[ant.y][ant.x];
        const transition = turmiteRule.transitions[ant.state][currentCell % turmiteRule.transitions[ant.state].length];
        
        // Write new value to cell
        this.grid[ant.y][ant.x] = transition.write;
        
        // Turn the ant
        this.turnAnt(ant, transition.turn);
        
        // Update ant state
        ant.state = transition.nextState;
        
        // Move the ant forward
        this.moveAnt(ant);
    }
    
    turnAnt(ant, turn) {
        switch (turn) {
            case 'L':
                ant.direction = (ant.direction + 3) % 4;
                break;
            case 'R':
                ant.direction = (ant.direction + 1) % 4;
                break;
            case 'LL':
                ant.direction = (ant.direction + 2) % 4;
                break;
            case 'RR':
                ant.direction = (ant.direction + 2) % 4;
                break;
            case 'U':
                ant.direction = (ant.direction + 2) % 4;
                break;
            case 'N':
                // No turn
                break;
        }
    }
    
    moveAnt(ant) {
        const dx = [0, 1, 0, -1]; // North, East, South, West
        const dy = [-1, 0, 1, 0];
        
        ant.x += dx[ant.direction];
        ant.y += dy[ant.direction];
        
        // Wrap around the grid instead of marking as inactive
        if (ant.x < 0) {
            ant.x = this.gridSize - 1;
        } else if (ant.x >= this.gridSize) {
            ant.x = 0;
        }
        
        if (ant.y < 0) {
            ant.y = this.gridSize - 1;
        } else if (ant.y >= this.gridSize) {
            ant.y = 0;
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Get color palette
        const colors = this.colorPalettes[this.rules] || this.generateColorPalette(this.rules.length);
        
        // Calculate visible grid bounds using actualZoom
        const startX = Math.max(0, Math.floor(this.viewportX / this.actualZoom));
        const startY = Math.max(0, Math.floor(this.viewportY / this.actualZoom));
        const endX = Math.min(this.gridSize, Math.ceil((this.viewportX + this.canvas.width) / this.actualZoom));
        const endY = Math.min(this.gridSize, Math.ceil((this.viewportY + this.canvas.height) / this.actualZoom));
        
        // Render visible grid cells with performance optimizations
        if (this.actualZoom >= 2) {
            // Use fillRect for larger cells (better performance at high zoom)
            for (let y = startY; y < endY; y++) {
                for (let x = startX; x < endX; x++) {
                    const cellValue = this.grid[y][x];
                    if (cellValue > 0) {
                        this.ctx.fillStyle = colors[cellValue % colors.length];
                        this.ctx.fillRect(
                            x * this.actualZoom - this.viewportX,
                            y * this.actualZoom - this.viewportY,
                            this.actualZoom,
                            this.actualZoom
                        );
                    }
                }
            }
        } else {
            // Use pixel-level rendering for very small cells
            for (let y = startY; y < endY; y++) {
                for (let x = startX; x < endX; x++) {
                    const cellValue = this.grid[y][x];
                    if (cellValue > 0) {
                        const pixelX = Math.floor(x * this.actualZoom - this.viewportX);
                        const pixelY = Math.floor(y * this.actualZoom - this.viewportY);
                        if (pixelX >= 0 && pixelX < this.canvas.width && pixelY >= 0 && pixelY < this.canvas.height) {
                            this.ctx.fillStyle = colors[cellValue % colors.length];
                            this.ctx.fillRect(pixelX, pixelY, Math.max(1, this.actualZoom), Math.max(1, this.actualZoom));
                        }
                    }
                }
            }
        }
        
        // Render ants based on performance mode
        if (this.performanceMode === 'normal' || (this.performanceMode === 'fast' && this.actualZoom >= 5)) {
            this.renderAnts();
        }
    }
    
    renderAnts() {
        this.ants.forEach((ant, index) => {
            if (!ant.active) return;
            
            const antScreenX = ant.x * this.actualZoom - this.viewportX;
            const antScreenY = ant.y * this.actualZoom - this.viewportY;
            
            // Only render if ant is visible
            if (antScreenX >= -this.actualZoom && antScreenX <= this.canvas.width &&
                antScreenY >= -this.actualZoom && antScreenY <= this.canvas.height) {
                
                // Render ant body
                this.ctx.fillStyle = '#FF0000';
                const antSize = Math.max(1, this.actualZoom - 1);
                this.ctx.fillRect(
                    antScreenX + (this.actualZoom - antSize) / 2,
                    antScreenY + (this.actualZoom - antSize) / 2,
                    antSize,
                    antSize
                );
                
                // Draw direction indicator if zoom is large enough
                if (this.actualZoom >= 3 && this.performanceMode === 'normal') {
                    this.ctx.fillStyle = '#FFFF00';
                    const centerX = antScreenX + this.actualZoom / 2;
                    const centerY = antScreenY + this.actualZoom / 2;
                    const dirX = [0, 1, 0, -1][ant.direction];
                    const dirY = [-1, 0, 1, 0][ant.direction];
                    const indicatorSize = Math.max(1, this.actualZoom / 4);
                    
                    this.ctx.fillRect(
                        centerX + dirX * this.actualZoom / 3 - indicatorSize / 2,
                        centerY + dirY * this.actualZoom / 3 - indicatorSize / 2,
                        indicatorSize,
                        indicatorSize
                    );
                }
            }
        });
    }
    
    generateColorPalette(length) {
        const colors = ['#000000']; // Always start with black
        for (let i = 1; i < length; i++) {
            colors.push(this.getColorFromHue(i * (360 / (length - 1))));
        }
        return colors;
    }
    
    toggleSimulation() {
        this.isRunning = !this.isRunning;
        const button = document.getElementById('start-pause');
        
        if (this.isRunning) {
            button.textContent = 'Pause';
            button.classList.add('running');
            this.animate();
        } else {
            button.textContent = 'Start';
            button.classList.remove('running');
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
        }
    }
    
    animate() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        const targetFrameTime = 1000 / this.fps;
        
        if (currentTime - this.lastRenderTime >= targetFrameTime) {
            // Batch multiple steps for performance
            for (let i = 0; i < this.stepsPerFrame; i++) {
                this.step();
            }
            
            // Skip rendering in ultra mode for better performance
            if (this.performanceMode === 'ultra') {
                this.renderSkipCounter++;
                if (this.renderSkipCounter >= 10) { // Render every 10 frames
                    this.render();
                    this.renderSkipCounter = 0;
                }
            } else {
                this.render();
            }
            
            this.lastRenderTime = currentTime;
        }
        
        if (this.isRunning) {
            this.animationId = requestAnimationFrame(() => this.animate());
        }
    }
    
    updateUI() {
        this.updateStepCounter();
        this.updateAntCounter();
        const button = document.getElementById('start-pause');
        button.textContent = 'Start';
        button.classList.remove('running');
    }
    
    updateStepCounter() {
        document.getElementById('step-counter').textContent = this.stepCounter;
    }
    
    updateAntCounter() {
        const activeAnts = this.ants.filter(ant => ant.active).length;
        document.getElementById('ant-counter').textContent = activeAnts;
    }
}

// Initialize the simulation when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new LangtonsAntSimulation();
});
