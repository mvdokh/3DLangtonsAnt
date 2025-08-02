class LangtonsAnt3DSimulation {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.gridSize = 50;
        this.isRunning = false;
        this.stepCounter = 0;
        this.fps = 10;
        this.stepsPerFrame = 1;
        this.animationId = null;
        
        // 3D Scene setup
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.cubeGeometry = null;
        this.cubes = [];
        this.antMeshes = [];
        
        // Grid and ants
        this.grid = [];
        this.ants = [];
        this.rules = 'RL';
        this.antType = 'langton';
        this.is3DRule = false; // Track if current rule uses 3D movement
        
        // 2D rule sets (classic behavior)
        this.twoDRules = new Set(['RL', 'RLR', 'LLRR', 'LRRRRRLLR', 'LLRRRLRLRLLR', 'RRLLLRLLLRRR', 'L2NNL1L2L1', 'L1L2NUL2L1R2', 'R1R2NUR2R1L2']);
        
        // 3D rule definitions
        this.threeDRules = {
            '3D_SPIRAL': 'RLUD',
            '3D_HELIX': 'RLUDUD', 
            '3D_TOWER': 'LRRLUD',
            '3D_MAZE': 'RLRLUD',
            '3D_CRYSTAL': 'LRUDUDLR'
        };
        
        // Mouse controls
        this.mouseDown = false;
        this.mouseButton = 0;
        this.previousMousePosition = { x: 0, y: 0 };
        this.cameraTarget = new THREE.Vector3(0, 0, 0);
        this.cameraRadius = 100;
        this.cameraTheta = 0;
        this.cameraPhi = Math.PI / 4;
        this.lastRenderTime = 0;
        
        // Color palettes for different rules
        this.colorPalettes = {
            'RL': [0x000000, 0xFFFFFF],
            'RLR': [0x000000, 0xFF0000, 0xFFFFFF],
            'LLRR': [0x000000, 0xFF0000, 0x00FF00, 0xFFFFFF],
            'LRRRRRLLR': [0x000000, 0xFF0000, 0xFF8000, 0xFFFF00, 0x80FF00, 0x00FF00, 0x00FF80, 0x00FFFF, 0x0080FF, 0xFFFFFF],
            'LLRRRLRLRLLR': Array.from({length: 12}, (_, i) => this.getColorFromHue(i * 30)),
            'RRLLLRLLLRRR': Array.from({length: 12}, (_, i) => this.getColorFromHue(i * 30)),
            'L2NNL1L2L1': [0x000000, 0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0xFF00FF, 0x00FFFF],
            'L1L2NUL2L1R2': [0x000000, 0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0xFF00FF, 0x00FFFF, 0xFFFFFF],
            'R1R2NUR2R1L2': [0x000000, 0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0xFF00FF, 0x00FFFF, 0xFFFFFF],
            // 3D rule palettes
            'RLUD': [0x000000, 0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00],
            'RLUDUD': [0x000000, 0xFF4500, 0x32CD32, 0x4169E1, 0xFFD700, 0xFF69B4, 0x00CED1],
            'LRRLUD': [0x000000, 0x8B0000, 0x006400, 0x000080, 0xB8860B, 0x8B008B, 0x008B8B],
            'RLRLUD': [0x000000, 0xFF6347, 0x90EE90, 0x87CEEB, 0xF0E68C, 0xDDA0DD],
            'LRUDUDLR': [0x000000, 0xDC143C, 0x228B22, 0x4682B4, 0xDAA520, 0x9932CC, 0x20B2AA, 0xFF1493]
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
        
        this.initializeScene();
        this.initializeGrid();
        this.initializeControls();
        this.setupMouseControls();
        this.reset();
        this.autoStartSimulation(); // Auto-start when page loads
    }
    
    getColorFromHue(hue) {
        const c = this.hslToRgb(hue / 360, 0.8, 0.6);
        return (c[0] << 16) | (c[1] << 8) | c[2];
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
    
    initializeScene() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);
        
        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // Initialize camera position
        this.updateCameraPosition();
        
        // Create cube geometry for grid cells
        this.cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    setupMouseControls() {
        const canvas = this.renderer.domElement;
        
        canvas.addEventListener('mousedown', (e) => {
            this.mouseDown = true;
            this.mouseButton = e.button;
            this.previousMousePosition = { x: e.clientX, y: e.clientY };
            e.preventDefault();
        });
        
        canvas.addEventListener('mouseup', () => {
            this.mouseDown = false;
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (this.mouseDown) {
                const deltaX = e.clientX - this.previousMousePosition.x;
                const deltaY = e.clientY - this.previousMousePosition.y;
                
                if (this.mouseButton === 0) { // Left mouse button - rotate
                    this.cameraTheta -= deltaX * 0.01;
                    this.cameraPhi += deltaY * 0.01;
                    this.cameraPhi = Math.max(0.1, Math.min(Math.PI - 0.1, this.cameraPhi));
                } else if (this.mouseButton === 2) { // Right mouse button - pan
                    const panSpeed = 0.1;
                    const right = new THREE.Vector3();
                    const up = new THREE.Vector3();
                    this.camera.getWorldDirection(new THREE.Vector3());
                    right.setFromMatrixColumn(this.camera.matrix, 0);
                    up.setFromMatrixColumn(this.camera.matrix, 1);
                    
                    this.cameraTarget.add(right.multiplyScalar(-deltaX * panSpeed));
                    this.cameraTarget.add(up.multiplyScalar(deltaY * panSpeed));
                }
                
                this.updateCameraPosition();
                this.previousMousePosition = { x: e.clientX, y: e.clientY };
            }
        });
        
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomSpeed = 5;
            this.cameraRadius += e.deltaY > 0 ? zoomSpeed : -zoomSpeed;
            this.cameraRadius = Math.max(10, Math.min(200, this.cameraRadius));
            this.updateCameraPosition();
        });
        
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    updateCameraPosition() {
        const x = this.cameraTarget.x + this.cameraRadius * Math.sin(this.cameraPhi) * Math.cos(this.cameraTheta);
        const y = this.cameraTarget.y + this.cameraRadius * Math.cos(this.cameraPhi);
        const z = this.cameraTarget.z + this.cameraRadius * Math.sin(this.cameraPhi) * Math.sin(this.cameraTheta);
        
        this.camera.position.set(x, y, z);
        this.camera.lookAt(this.cameraTarget);
    }
    
    initializeGrid() {
        this.grid = Array(this.gridSize).fill().map(() => 
            Array(this.gridSize).fill().map(() => 
                Array(this.gridSize).fill(0)
            )
        );
        
        // Clear existing cubes
        this.cubes.forEach(cubeLayer => {
            cubeLayer.forEach(cubeRow => {
                cubeRow.forEach(cube => {
                    if (cube) {
                        this.scene.remove(cube);
                    }
                });
            });
        });
        
        // Initialize 3D cube array
        this.cubes = Array(this.gridSize).fill().map(() => 
            Array(this.gridSize).fill().map(() => 
                Array(this.gridSize).fill(null)
            )
        );
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
        
        document.getElementById('grid-size').addEventListener('input', (e) => {
            this.gridSize = parseInt(e.target.value);
            document.getElementById('grid-size-value').textContent = this.gridSize;
            this.reset();
        });
        
        document.getElementById('speed').addEventListener('input', (e) => {
            this.fps = parseInt(e.target.value);
            document.getElementById('speed-value').textContent = this.fps;
        });
        
        document.getElementById('steps-per-frame').addEventListener('input', (e) => {
            this.stepsPerFrame = parseInt(e.target.value);
            document.getElementById('steps-value').textContent = this.stepsPerFrame;
        });
        
        document.getElementById('zoom-level').addEventListener('input', (e) => {
            this.cameraRadius = 200 - (parseFloat(e.target.value) - 1) * 10;
            document.getElementById('zoom-value').textContent = e.target.value + 'x';
            this.updateCameraPosition();
        });
        
        document.getElementById('performance-mode').addEventListener('change', (e) => {
            // Performance mode can be implemented for 3D if needed
        });
        
        document.getElementById('rule-preset').addEventListener('change', (e) => {
            const customGroup = document.getElementById('custom-rule-group');
            if (e.target.value === 'custom') {
                customGroup.style.display = 'block';
            } else {
                customGroup.style.display = 'none';
                
                // Check if it's a 3D rule
                if (this.threeDRules[e.target.value]) {
                    this.rules = this.threeDRules[e.target.value];
                    this.is3DRule = true;
                } else {
                    this.rules = e.target.value;
                    this.is3DRule = false;
                }
                
                this.reset();
                this.autoStartSimulation();
            }
        });
        
        document.getElementById('custom-rule').addEventListener('change', (e) => {
            this.rules = e.target.value || 'RL';
            // Custom rules are assumed to be 2D unless they contain 3D movement indicators
            this.is3DRule = /[UD]/.test(this.rules);
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
    }
    
    addAnt(x, y, z, direction = 0, state = 0) {
        if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize && z >= 0 && z < this.gridSize) {
            const ant = {
                x: x,
                y: y,
                z: z,
                direction: direction, // 0-5: +X, -X, +Y, -Y, +Z, -Z
                state: state, // For turmites
                active: true
            };
            this.ants.push(ant);
            
            // Create 3D ant representation
            const antGeometry = new THREE.SphereGeometry(0.3, 8, 6);
            const antMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
            const antMesh = new THREE.Mesh(antGeometry, antMaterial);
            
            antMesh.position.set(
                x - this.gridSize / 2,
                y - this.gridSize / 2,
                z - this.gridSize / 2
            );
            
            this.scene.add(antMesh);
            this.antMeshes.push(antMesh);
            
            this.updateAntCounter();
        }
    }
    
    updateAntPosition(antIndex) {
        if (antIndex < this.antMeshes.length && antIndex < this.ants.length) {
            const ant = this.ants[antIndex];
            const mesh = this.antMeshes[antIndex];
            
            mesh.position.set(
                ant.x - this.gridSize / 2,
                ant.y - this.gridSize / 2,
                ant.z - this.gridSize / 2
            );
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
            }, 100);
        }
    }
    
    reset() {
        this.isRunning = false;
        this.stepCounter = 0;
        
        // Remove all ants from scene
        this.antMeshes.forEach(mesh => {
            this.scene.remove(mesh);
        });
        this.ants = [];
        this.antMeshes = [];
        
        this.initializeGrid();
        
        const numAnts = parseInt(document.getElementById('num-ants').value);
        const centerX = Math.floor(this.gridSize / 2);
        const centerY = Math.floor(this.gridSize / 2);
        const centerZ = Math.floor(this.gridSize / 2);
        
        // Add ants in a small pattern around center
        for (let i = 0; i < numAnts; i++) {
            const angle = (i / numAnts) * 2 * Math.PI;
            const radius = Math.min(3, numAnts);
            const x = centerX + Math.floor(Math.cos(angle) * radius);
            const y = centerY;
            const z = this.is3DRule ? centerZ + Math.floor(Math.sin(angle) * radius) : centerZ;
            
            // For 2D rules, limit initial direction to 0-3 (X-Y plane)
            const direction = this.is3DRule ? i % 6 : i % 4;
            this.addAnt(x, y, z, direction);
        }
        
        this.updateUI();
        this.render();
        
        // Stop animation if running
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    step() {
        this.ants.forEach((ant, index) => {
            if (!ant.active) return;
            
            if (this.antType === 'langton') {
                this.stepLangtonAnt(ant);
            } else {
                this.stepTurmite(ant);
            }
            
            this.updateAntPosition(index);
        });
        
        this.stepCounter++;
        this.updateStepCounter();
    }
    
    stepLangtonAnt(ant) {
        const currentCell = this.grid[ant.y][ant.x][ant.z];
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
            turn = this.is3DRule ? 'U' : 'UU'; // Up in 3D, or 180 turn in 2D
        } else if (rule === 'D') {
            turn = this.is3DRule ? 'D' : 'UU'; // Down in 3D, or 180 turn in 2D
        }
        
        // Update cell color
        this.grid[ant.y][ant.x][ant.z] = (currentCell + 1) % this.rules.length;
        this.updateGridVisualization(ant.x, ant.y, ant.z);
        
        // Turn the ant
        this.turnAnt(ant, turn);
        
        // Move the ant forward
        this.moveAnt(ant);
    }
    
    stepTurmite(ant) {
        const turmiteRule = this.turmiteRules[this.antType];
        if (!turmiteRule) return;
        
        const currentCell = this.grid[ant.y][ant.x][ant.z];
        const transition = turmiteRule.transitions[ant.state][currentCell % turmiteRule.transitions[ant.state].length];
        
        // Write new value to cell
        this.grid[ant.y][ant.x][ant.z] = transition.write;
        this.updateGridVisualization(ant.x, ant.y, ant.z);
        
        // Turn the ant
        this.turnAnt(ant, transition.turn);
        
        // Update ant state
        ant.state = transition.nextState;
        
        // Move the ant forward
        this.moveAnt(ant);
    }
    
    turnAnt(ant, turn) {
        if (this.is3DRule) {
            // 3D directions: 0: +X, 1: -X, 2: +Y, 3: -Y, 4: +Z, 5: -Z
            const rotationMap = {
                'L': [2, 3, 1, 0, 4, 5], // Rotate around Z axis (counterclockwise)
                'R': [3, 2, 0, 1, 4, 5], // Rotate around Z axis (clockwise)
                'LL': [1, 0, 3, 2, 4, 5], // 180 degrees around Z
                'RR': [1, 0, 3, 2, 4, 5], // 180 degrees around Z
                'U': [4, 5, 2, 3, 1, 0], // Turn to face up/down (Z direction)
                'D': [5, 4, 2, 3, 0, 1], // Turn to face down/up (Z direction)
                'UU': [1, 0, 3, 2, 4, 5], // U-turn (180 degrees)
                'N': [0, 1, 2, 3, 4, 5]  // No turn
            };
            
            if (rotationMap[turn]) {
                ant.direction = rotationMap[turn][ant.direction];
            }
        } else {
            // 2D movement: limit to X-Y plane (directions 0-3)
            // 0: +X, 1: -X, 2: +Y, 3: -Y
            switch (turn) {
                case 'L':
                    ant.direction = [2, 3, 1, 0][ant.direction % 4];
                    break;
                case 'R':
                    ant.direction = [3, 2, 0, 1][ant.direction % 4];
                    break;
                case 'LL':
                case 'RR':
                case 'U':
                case 'UU':
                    ant.direction = [1, 0, 3, 2][ant.direction % 4]; // 180 degrees
                    break;
                case 'D': // In 2D, treat D as reverse like U
                    ant.direction = [1, 0, 3, 2][ant.direction % 4]; // 180 degrees
                    break;
                case 'N':
                    // No turn
                    break;
            }
        }
    }
    
    moveAnt(ant) {
        if (this.is3DRule) {
            // 3D movement directions: 0: +X, 1: -X, 2: +Y, 3: -Y, 4: +Z, 5: -Z
            const dx = [1, -1, 0, 0, 0, 0];
            const dy = [0, 0, 1, -1, 0, 0];
            const dz = [0, 0, 0, 0, 1, -1];
            
            ant.x += dx[ant.direction];
            ant.y += dy[ant.direction];
            ant.z += dz[ant.direction];
        } else {
            // 2D movement: only move in X-Y plane, keep Z constant
            const dx = [1, -1, 0, 0]; // +X, -X, +Y, -Y
            const dy = [0, 0, 1, -1];
            
            ant.x += dx[ant.direction % 4];
            ant.y += dy[ant.direction % 4];
            // Z stays the same for 2D rules
        }
        
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
        
        if (ant.z < 0) {
            ant.z = this.gridSize - 1;
        } else if (ant.z >= this.gridSize) {
            ant.z = 0;
        }
    }
    
    updateGridVisualization(x, y, z) {
        const cellValue = this.grid[y][x][z];
        
        // Remove existing cube if it exists
        if (this.cubes[y][x][z]) {
            this.scene.remove(this.cubes[y][x][z]);
            this.cubes[y][x][z] = null;
        }
        
        // Add new cube if cell is not empty
        if (cellValue > 0) {
            const colors = this.colorPalettes[this.rules] || this.generateColorPalette(this.rules.length);
            const color = colors[cellValue % colors.length];
            
            const material = new THREE.MeshPhongMaterial({ color: color });
            const cube = new THREE.Mesh(this.cubeGeometry, material);
            
            cube.position.set(
                x - this.gridSize / 2,
                y - this.gridSize / 2,
                z - this.gridSize / 2
            );
            
            this.scene.add(cube);
            this.cubes[y][x][z] = cube;
        }
    }
    
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    
    generateColorPalette(length) {
        const colors = [0x000000]; // Always start with black
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
        
        if (currentTime - this.lastRenderTime >= targetFrameTime || !this.lastRenderTime) {
            // Batch multiple steps for performance
            for (let i = 0; i < this.stepsPerFrame; i++) {
                this.step();
            }
            
            this.render();
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
    new LangtonsAnt3DSimulation();
});
