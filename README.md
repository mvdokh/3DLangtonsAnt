# Langton's Ant Simulation

An interactive, high-performance Langton's Ant simulation with multiple rule sets, turmites, and advanced features.

![Langton's Ant](https://img.shields.io/badge/Langton's%20Ant-Simulation-brightgreen)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)
![Canvas](https://img.shields.io/badge/HTML5-Canvas-orange)

## 🎮 Features

### 🐜 **Multiple Ant Types**
- **Langton's Ant**: Classic and extended rule sets
- **Turmites**: 4 different turmite variants with complex behaviors

### 🌈 **Rule Sets**
- **Classic RL**: The original Langton's Ant
- **Extended Rules**: RLR, LLRR, LRRRRRLLR, LLRRRLRLRLLR, RRLLLRLLLRRR
- **Advanced Rules**: L2NNL1L2L1, L1L2NUL2L1R2, R1R2NUR2R1L2 (with special moves)
- **Custom Rules**: Define your own patterns

### ⚡ **Performance Features**
- **Ultra-fast execution**: Up to 120,000 steps per second
- **Multiple performance modes**: Normal, Fast, Ultra
- **Real-time controls**: Adjust speed without pausing
- **Efficient rendering**: Only renders visible areas

### 🔍 **Interactive Controls**
- **Full-screen experience**: Immersive simulation view
- **Mouse wheel zooming**: 1x = full grid view, higher = zoom in
- **Center-locked**: Always stays focused on the grid center
- **Click to add ants**: Interactive ant placement

### 🔄 **Advanced Behaviors**
- **Wrapping boundaries**: Ants wrap around edges for infinite patterns
- **Multiple ants**: Support for up to 20 simultaneous ants
- **Hidden controls**: Subtle menu system with comprehensive options

## 🚀 Quick Start

1. **Clone or download** this repository
2. **Open `index.html`** in any modern web browser
3. **Click the gear icon** (⚙️) in the top-right to access controls
4. **Start the simulation** and watch patterns emerge!

## 🎛️ Controls

### Speed Controls
- **FPS**: 1-120 frames per second
- **Steps per Frame**: 1-1000 computations per frame
- **Performance Mode**: Normal/Fast/Ultra for different speed needs

### Rules & Ants
- **Rule Presets**: Choose from various classic and extended rule sets
- **Custom Rules**: Define your own with L/R/L2/R2/N/U notation
- **Ant Types**: Switch between Langton's Ant and Turmite variants
- **Number of Ants**: 1-20 ants can run simultaneously

### Display
- **Zoom**: 1x (full grid) to 20x (detailed view)
- **Mouse Wheel**: Zoom in/out while keeping center focus

## 🧮 Rule Notation

- **L/R**: Turn left/right
- **L1/R1**: Turn left/right once (same as L/R)
- **L2/R2**: Turn left/right twice (180°)
- **N**: No turn (continue straight)
- **U**: U-turn (same as L2/R2)

## 🏗️ Technical Details

- **Pure JavaScript**: No external dependencies
- **HTML5 Canvas**: Hardware-accelerated rendering
- **Efficient algorithms**: Viewport culling and optimized rendering
- **Responsive design**: Adapts to any screen size

## 🎨 Interesting Patterns to Try

1. **Highway Formation**: Classic RL with single ant
2. **Spiral Growth**: Try RLR or LLRR rules
3. **Complex Symmetries**: Use LRRRRRLLR with multiple ants
4. **Chaotic Beauty**: RRLLLRLLLRRR creates intricate patterns
5. **Turmite Fractals**: Switch to Turmite modes for different behaviors

## 🔧 Browser Compatibility

Works in all modern browsers:
- Chrome/Edge 80+
- Firefox 75+
- Safari 13+

## 📝 License

MIT License - Feel free to use, modify, and distribute!

## 🤝 Contributing

Contributions welcome! Feel free to:
- Add new rule sets
- Implement new turmite types
- Optimize performance further
- Enhance the UI/UX

---

**Enjoy exploring the fascinating world of cellular automata!** 🐜✨
