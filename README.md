# Retro Web Arcade 🕹️

A complete retro-style web arcade featuring 10 classic games with authentic CRT effects, high score tracking, and full mobile support.

## Features

- 🎮 **10 Complete Games**: Snake, Pong, Breakout, Flappy Bird, Space Invaders, Frogger, Tetris, Asteroids, Pac-Man, and Roguelike
- 🖥️ **CRT Effects**: Authentic scanlines, screen curvature, bloom, and chromatic aberration
- 🏆 **High Score System**: Track top 10 scores for each game with persistent storage
- 🎵 **Audio System**: Sound effects and music with volume controls
- 📱 **Mobile Support**: Touch controls and responsive design
- ⌨️ **Multiple Input Methods**: Keyboard, touch, and gamepad support
- 🎨 **Retro Aesthetic**: Neon color palette and pixel-perfect rendering

## Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Visit http://localhost:3000/ to play!

### Production Build

```bash
npm run build
```

The production build will be in the `dist/` folder.

## Controls

### General Navigation

- **Arrow Keys**: Navigate menus and move in games
- **Enter**: Select menu items
- **Escape**: Pause game / Return to menu

### Game-Specific Controls

Each game has its own control scheme displayed in the game selection screen.

## Games

### 1. Snake 🐍

Classic snake game with growing tail and increasing speed.

- **Controls**: Arrow keys or WASD
- **Goal**: Eat food, grow longer, avoid hitting yourself

### 2. Pong 🏓

Two-paddle tennis with AI opponent.

- **Controls**: W/S or Up/Down arrows
- **Goal**: First to 11 points wins

### 3. Breakout 🧱

Break bricks with a bouncing ball and collect powerups.

- **Controls**: Left/Right arrows or A/D
- **Goal**: Clear all bricks across 5 levels

### 4. Flappy Bird 🐦

Tap to fly through pipes.

- **Controls**: Spacebar or tap
- **Goal**: Pass as many pipes as possible

### 5. Space Invaders 👾

Defend Earth from descending alien invaders.

- **Controls**: Left/Right to move, Space to shoot
- **Goal**: Destroy all aliens before they reach you

### 6. Frogger 🐸

Guide the frog across roads and rivers to reach home.

- **Controls**: Arrow keys
- **Goal**: Fill all 5 home bases

### 7. Tetris 🟦

Arrange falling blocks to clear lines.

- **Controls**: Arrows to move/rotate, Space to drop
- **Goal**: Clear lines and survive as long as possible

### 8. Asteroids ☄️

Pilot a spaceship through an asteroid field.

- **Controls**: Arrows to rotate/thrust, Space to shoot
- **Goal**: Destroy asteroids and survive waves

### 9. Pac-Man 👻

Navigate a maze, eat dots, and avoid ghosts.

- **Controls**: Arrow keys
- **Goal**: Eat all dots while avoiding ghosts

### 10. Roguelike (Dungeon) ⚔️

Explore procedurally generated dungeons.

- **Controls**: Arrow keys or WASD
- **Goal**: Reach floor 5 and defeat the boss

## Development

### Project Structure

```
retroarcade/
├── src/
│   ├── main.js                 # Entry point
│   ├── arcade/                 # Arcade shell and systems
│   │   ├── ArcadeShell.js      # Main arcade interface
│   │   ├── InputManager.js     # Input handling
│   │   ├── AudioManager.js     # Audio system
│   │   ├── CRTEffect.js        # CRT visual effects
│   │   ├── HighScoreManager.js # High score tracking
│   │   └── GameLoader.js       # Dynamic game loading
│   ├── games/                  # Game implementations
│   │   ├── Game.js             # Base game class
│   │   ├── snake/
│   │   ├── pong/
│   │   ├── breakout/
│   │   ├── flappy/
│   │   ├── space-invaders/
│   │   ├── frogger/
│   │   ├── tetris/
│   │   ├── asteroids/
│   │   ├── pacman/
│   │   └── roguelike/
│   └── utils/                  # Shared utilities
├── styles/                     # CSS stylesheets
│   ├── main.css                # Base retro styles
│   ├── arcade.css              # Arcade UI styles
│   ├── crt.css                 # CRT effects
│   └── controls.css            # Touch controls
├── tests/                      # Unit tests
├── assets/                     # Sprites and sounds
└── index.html                  # HTML entry point
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run all tests
- `npm run test:ui` - Run tests with UI
- `npm run coverage` - Generate test coverage report
- `npm run lint` - Run ESLint

### Testing

The project includes comprehensive unit tests for all systems and games:

```bash
# Run all tests
npm run test

# Run specific game tests
npm run test -- Snake
npm run test -- Tetris

# Run with coverage
npm run coverage
```

### Adding a New Game

1. Create a new directory in `src/games/[game-name]/`
2. Implement your game class extending `Game` base class
3. Export your game in `index.js`
4. Add game to the arcade menu in `ArcadeShell.js`
5. Write unit tests in `tests/games/[game-name]/`

Example game structure:

```javascript
import Game from "../Game.js";

export default class MyGame extends Game {
  static get config() {
    return {
      id: "mygame",
      title: "My Game",
      description: "A fun game!",
      startLives: 3,
      highScoreType: "highest",
      controls: {
        movement: "Arrow keys",
        action1: "Space",
        pause: "Escape",
      },
    };
  }

  async init() {
    // Initialize your game
  }

  update(deltaTime) {
    // Update game logic (called 60 times per second)
  }

  render(ctx) {
    // Draw your game
  }
}
```

## Technical Details

### Architecture

- **Fixed Timestep Game Loop**: Consistent 60 FPS physics updates
- **Component-Based Systems**: Modular arcade systems (input, audio, scoring)
- **Dynamic Module Loading**: Games loaded on-demand for optimal performance
- **State Management**: Clean state machine for arcade and game states
- **Canvas Rendering**: Hardware-accelerated 2D canvas with pixel-perfect scaling

### Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Android Chrome)

### Performance

- 60 FPS maintained across all games
- Initial load under 3 seconds
- Per-game load time under 500ms
- Lighthouse performance score ≥ 90

## Credits

Built with:

- [Vite](https://vitejs.dev/) - Build tool
- [Vitest](https://vitest.dev/) - Testing framework
- [ESLint](https://eslint.org/) - Code linting
- [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) - Retro pixel font

## License

MIT License - Feel free to use this project for learning and fun!

---

**Enjoy the retro arcade experience! 🎮✨**
