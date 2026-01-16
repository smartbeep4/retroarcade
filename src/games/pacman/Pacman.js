/**
 * Pac-Man Game
 * Navigate the maze, eat all dots, avoid ghosts!
 * Grab power pellets to turn the tables and eat the ghosts!
 */
import { Game } from '../Game.js'

// Simplified 21x21 maze
const MAZE = [
  '#####################',
  '#.........#.........#',
  '#.###.###.#.###.###.#',
  '#o###.###.#.###.###o#',
  '#...................#',
  '#.###.#.#####.#.###.#',
  '#.....#...#...#.....#',
  '#####.### # ###.#####',
  '    #.#       #.#    ',
  '#####.# ##=## #.#####',
  '     .  #GGG#  .     ',
  '#####.# ##### #.#####',
  '    #.#       #.#    ',
  '#####.# ##### #.#####',
  '#.........#.........#',
  '#.###.###.#.###.###.#',
  '#o..#.....P.....#..o#',
  '###.#.#.#####.#.#.###',
  '#.....#...#...#.....#',
  '#.#######.#.#######.#',
  '#####################',
]

// Legend: # = wall, . = dot, o = power pellet, P = pacman start, G = ghost house, = = gate

const GHOST_COLORS = {
  blinky: '#ff2a6d',
  pinky: '#ffb8de',
  inky: '#05d9e8',
  clyde: '#ff6b35',
}

export class Pacman extends Game {
  static get config() {
    return {
      id: 'pacman',
      title: 'Pac-Man',
      description: 'Eat dots, avoid ghosts!',
      thumbnail: '/assets/sprites/pacman-thumb.png',
      startLives: 3,
      highScoreType: 'highest',
      controls: {
        movement: 'Arrow keys',
        action1: 'Not used',
        action2: 'Not used',
        pause: 'Escape',
      },
    }
  }

  async init() {
    await super.init()

    // Grid settings
    this.tileSize = 28
    this.cols = MAZE[0].length
    this.rows = MAZE.length
    this.offsetX = (this.canvas.width - this.cols * this.tileSize) / 2
    this.offsetY = (this.canvas.height - this.rows * this.tileSize) / 2

    // Pac-Man settings
    this.pacmanSpeed = 0.12 // Tiles per frame

    // Ghost settings
    this.ghostSpeed = 0.1
    this.frightenedSpeed = 0.05

    // Mode timing
    this.scatterDuration = 7000
    this.chaseDuration = 20000
    this.frightenedDuration = 8000

    // Game state
    this.maze = []
    this.dots = []
    this.powerPellets = []
    this.pacman = null
    this.ghosts = []
    this.mode = 'scatter' // scatter, chase, frightened
    this.modeTimer = 0
    this.ghostsEaten = 0
    this.totalDots = 0
    this.dotsEaten = 0
    this.fruit = null

    this.resetLevel()
  }

  reset() {
    super.reset()
    if (this.maze && this.maze.length > 0) {
      this.resetLevel()
    }
  }

  resetLevel() {
    this.parseMaze()
    this.createGhosts()
    this.mode = 'scatter'
    this.modeTimer = this.scatterDuration
    this.ghostsEaten = 0
    this.fruit = null
  }

  parseMaze() {
    this.maze = []
    this.dots = []
    this.powerPellets = []
    this.totalDots = 0
    this.dotsEaten = 0

    for (let row = 0; row < this.rows; row++) {
      this.maze[row] = []
      for (let col = 0; col < this.cols; col++) {
        const char = MAZE[row][col]
        this.maze[row][col] = char === '#' ? 1 : 0

        if (char === '.') {
          this.dots.push({ col, row, eaten: false })
          this.totalDots++
        } else if (char === 'o') {
          this.powerPellets.push({ col, row, eaten: false })
        } else if (char === 'P') {
          this.pacman = {
            col,
            row,
            x: col,
            y: row,
            direction: { x: 0, y: 0 },
            nextDirection: { x: 0, y: 0 },
            mouthAngle: 0,
            mouthDir: 1,
          }
        }
      }
    }
  }

  createGhosts() {
    const ghostHouseCol = 10
    const ghostHouseRow = 10

    this.ghosts = [
      {
        name: 'blinky',
        col: ghostHouseCol,
        row: ghostHouseRow - 2,
        x: ghostHouseCol,
        y: ghostHouseRow - 2,
        color: GHOST_COLORS.blinky,
        direction: { x: -1, y: 0 },
        frightened: false,
        eaten: false,
        scatterTarget: { col: 19, row: 0 },
      },
      {
        name: 'pinky',
        col: ghostHouseCol,
        row: ghostHouseRow,
        x: ghostHouseCol,
        y: ghostHouseRow,
        color: GHOST_COLORS.pinky,
        direction: { x: 0, y: -1 },
        frightened: false,
        eaten: false,
        scatterTarget: { col: 2, row: 0 },
      },
      {
        name: 'inky',
        col: ghostHouseCol - 1,
        row: ghostHouseRow,
        x: ghostHouseCol - 1,
        y: ghostHouseRow,
        color: GHOST_COLORS.inky,
        direction: { x: 0, y: -1 },
        frightened: false,
        eaten: false,
        scatterTarget: { col: 19, row: 20 },
      },
      {
        name: 'clyde',
        col: ghostHouseCol + 1,
        row: ghostHouseRow,
        x: ghostHouseCol + 1,
        y: ghostHouseRow,
        color: GHOST_COLORS.clyde,
        direction: { x: 0, y: -1 },
        frightened: false,
        eaten: false,
        scatterTarget: { col: 0, row: 20 },
      },
    ]
  }

  update(deltaTime) {
    if (this.state !== 'running') return

    // Handle input
    this.handleInput()

    // Update mode timer
    this.updateMode(deltaTime)

    // Update Pac-Man
    this.updatePacman()

    // Update ghosts
    this.updateGhosts()

    // Check collisions
    this.checkCollisions()

    // Check fruit spawn
    this.checkFruitSpawn(deltaTime)

    // Check level complete
    if (this.dotsEaten >= this.totalDots) {
      this.completeLevel()
    }
  }

  handleInput() {
    if (this.input.isJustPressed('up')) {
      this.pacman.nextDirection = { x: 0, y: -1 }
    } else if (this.input.isJustPressed('down')) {
      this.pacman.nextDirection = { x: 0, y: 1 }
    } else if (this.input.isJustPressed('left')) {
      this.pacman.nextDirection = { x: -1, y: 0 }
    } else if (this.input.isJustPressed('right')) {
      this.pacman.nextDirection = { x: 1, y: 0 }
    }
  }

  updateMode(deltaTime) {
    if (this.mode === 'frightened') {
      this.modeTimer -= deltaTime
      if (this.modeTimer <= 0) {
        this.mode = 'chase'
        this.modeTimer = this.chaseDuration
        this.ghosts.forEach((g) => (g.frightened = false))
        this.ghostsEaten = 0
      }
    } else {
      this.modeTimer -= deltaTime
      if (this.modeTimer <= 0) {
        this.mode = this.mode === 'scatter' ? 'chase' : 'scatter'
        this.modeTimer =
          this.mode === 'scatter' ? this.scatterDuration : this.chaseDuration
      }
    }
  }

  updatePacman() {
    const pm = this.pacman

    // Mouth animation
    pm.mouthAngle += 0.15 * pm.mouthDir
    if (pm.mouthAngle > 0.4) pm.mouthDir = -1
    if (pm.mouthAngle < 0) pm.mouthDir = 1

    // Try to change direction
    if (this.canMove(pm.col, pm.row, pm.nextDirection)) {
      pm.direction = { ...pm.nextDirection }
    }

    // Move in current direction
    if (pm.direction.x !== 0 || pm.direction.y !== 0) {
      if (this.canMove(pm.col, pm.row, pm.direction)) {
        pm.x += pm.direction.x * this.pacmanSpeed
        pm.y += pm.direction.y * this.pacmanSpeed

        // Snap to grid
        if (
          Math.abs(pm.x - Math.round(pm.x)) < 0.1 &&
          Math.abs(pm.y - Math.round(pm.y)) < 0.1
        ) {
          pm.col = Math.round(pm.x)
          pm.row = Math.round(pm.y)
          pm.x = pm.col
          pm.y = pm.row
        }
      }
    }

    // Tunnel wrap
    if (pm.col < 0) {
      pm.col = this.cols - 1
      pm.x = pm.col
    }
    if (pm.col >= this.cols) {
      pm.col = 0
      pm.x = pm.col
    }

    // Eat dots
    this.eatDots()
  }

  eatDots() {
    const pm = this.pacman

    // Regular dots
    for (const dot of this.dots) {
      if (!dot.eaten && dot.col === pm.col && dot.row === pm.row) {
        dot.eaten = true
        this.dotsEaten++
        this.score += 10
        this.audio.play('score')
      }
    }

    // Power pellets
    for (const pellet of this.powerPellets) {
      if (!pellet.eaten && pellet.col === pm.col && pellet.row === pm.row) {
        pellet.eaten = true
        this.score += 50
        this.activateFrightened()
        this.audio.play('powerup')
      }
    }

    // Fruit
    if (this.fruit && this.fruit.col === pm.col && this.fruit.row === pm.row) {
      this.score += this.fruit.points
      this.audio.play('score')
      this.fruit = null
    }
  }

  activateFrightened() {
    this.mode = 'frightened'
    this.modeTimer = this.frightenedDuration
    this.ghostsEaten = 0
    this.ghosts.forEach((g) => {
      if (!g.eaten) {
        g.frightened = true
        // Reverse direction
        g.direction = { x: -g.direction.x, y: -g.direction.y }
      }
    })
  }

  updateGhosts() {
    for (const ghost of this.ghosts) {
      if (ghost.eaten) {
        // Return to ghost house
        this.moveGhostToTarget(ghost, { col: 10, row: 10 })
        if (ghost.col === 10 && ghost.row === 10) {
          ghost.eaten = false
          ghost.frightened = false
        }
      } else if (ghost.frightened) {
        // Random movement when frightened
        this.moveGhostRandom(ghost)
      } else if (this.mode === 'scatter') {
        this.moveGhostToTarget(ghost, ghost.scatterTarget)
      } else {
        // Chase mode - use AI
        const target = this.getGhostTarget(ghost)
        this.moveGhostToTarget(ghost, target)
      }
    }
  }

  getGhostTarget(ghost) {
    const pm = this.pacman

    switch (ghost.name) {
      case 'blinky':
        // Direct chase
        return { col: pm.col, row: pm.row }

      case 'pinky':
        // Target 4 tiles ahead
        return {
          col: pm.col + pm.direction.x * 4,
          row: pm.row + pm.direction.y * 4,
        }

      case 'inky': {
        // Complex: uses Blinky's position
        const blinky = this.ghosts[0]
        const ahead = {
          col: pm.col + pm.direction.x * 2,
          row: pm.row + pm.direction.y * 2,
        }
        return {
          col: ahead.col + (ahead.col - blinky.col),
          row: ahead.row + (ahead.row - blinky.row),
        }
      }

      case 'clyde': {
        // Chase when far, scatter when close
        const dist =
          Math.abs(pm.col - ghost.col) + Math.abs(pm.row - ghost.row)
        if (dist > 8) {
          return { col: pm.col, row: pm.row }
        }
        return ghost.scatterTarget
      }

      default:
        return { col: pm.col, row: pm.row }
    }
  }

  moveGhostToTarget(ghost, target) {
    // At intersection, choose direction toward target
    if (
      Math.abs(ghost.x - ghost.col) < 0.05 &&
      Math.abs(ghost.y - ghost.row) < 0.05
    ) {
      ghost.x = ghost.col
      ghost.y = ghost.row

      const directions = [
        { x: 0, y: -1 }, // up
        { x: 0, y: 1 }, // down
        { x: -1, y: 0 }, // left
        { x: 1, y: 0 }, // right
      ]

      let bestDir = ghost.direction
      let bestDist = Infinity

      for (const dir of directions) {
        // Can't reverse
        if (dir.x === -ghost.direction.x && dir.y === -ghost.direction.y)
          continue

        // Can't go through walls
        if (!this.canMove(ghost.col, ghost.row, dir)) continue

        const nextCol = ghost.col + dir.x
        const nextRow = ghost.row + dir.y
        const dist =
          Math.abs(target.col - nextCol) + Math.abs(target.row - nextRow)

        if (dist < bestDist) {
          bestDist = dist
          bestDir = dir
        }
      }

      ghost.direction = bestDir
    }

    const speed = ghost.frightened ? this.frightenedSpeed : this.ghostSpeed
    ghost.x += ghost.direction.x * speed
    ghost.y += ghost.direction.y * speed

    // Snap to grid
    if (
      Math.abs(ghost.x - Math.round(ghost.x)) < 0.05 &&
      Math.abs(ghost.y - Math.round(ghost.y)) < 0.05
    ) {
      ghost.col = Math.round(ghost.x)
      ghost.row = Math.round(ghost.y)
    }

    // Tunnel wrap
    if (ghost.col < 0) {
      ghost.col = this.cols - 1
      ghost.x = ghost.col
    }
    if (ghost.col >= this.cols) {
      ghost.col = 0
      ghost.x = ghost.col
    }
  }

  moveGhostRandom(ghost) {
    if (
      Math.abs(ghost.x - ghost.col) < 0.05 &&
      Math.abs(ghost.y - ghost.row) < 0.05
    ) {
      const directions = [
        { x: 0, y: -1 },
        { x: 0, y: 1 },
        { x: -1, y: 0 },
        { x: 1, y: 0 },
      ].filter((d) => {
        if (d.x === -ghost.direction.x && d.y === -ghost.direction.y)
          return false
        return this.canMove(ghost.col, ghost.row, d)
      })

      if (directions.length > 0) {
        ghost.direction =
          directions[Math.floor(Math.random() * directions.length)]
      }
    }

    ghost.x += ghost.direction.x * this.frightenedSpeed
    ghost.y += ghost.direction.y * this.frightenedSpeed

    // Snap to grid
    if (
      Math.abs(ghost.x - Math.round(ghost.x)) < 0.05 &&
      Math.abs(ghost.y - Math.round(ghost.y)) < 0.05
    ) {
      ghost.col = Math.round(ghost.x)
      ghost.row = Math.round(ghost.y)
    }
  }

  canMove(col, row, direction) {
    const nextCol = col + direction.x
    const nextRow = row + direction.y

    // Bounds check - allow tunnel at sides
    if (
      nextCol < 0 ||
      nextCol >= this.cols ||
      nextRow < 0 ||
      nextRow >= this.rows
    ) {
      return col === 0 || col === this.cols - 1 // Allow tunnel at edges
    }

    return this.maze[nextRow][nextCol] !== 1
  }

  checkCollisions() {
    const pm = this.pacman

    for (const ghost of this.ghosts) {
      if (ghost.eaten) continue

      const dist = Math.abs(pm.x - ghost.x) + Math.abs(pm.y - ghost.y)

      if (dist < 0.8) {
        if (ghost.frightened) {
          // Eat ghost
          ghost.eaten = true
          this.ghostsEaten++
          const points = [200, 400, 800, 1600][
            Math.min(this.ghostsEaten - 1, 3)
          ]
          this.score += points
          this.audio.play('score')
        } else {
          // Die
          this.die()
          return
        }
      }
    }
  }

  checkFruitSpawn(deltaTime) {
    if (!this.fruit && this.dotsEaten === 70) {
      this.fruit = {
        col: 10,
        row: 13,
        points: 100,
        timer: 10000,
      }
    }

    if (this.fruit) {
      this.fruit.timer -= deltaTime
      if (this.fruit.timer <= 0) {
        this.fruit = null
      }
    }
  }

  completeLevel() {
    this.level++
    this.audio.play('powerup')

    // Increase difficulty on higher levels
    this.pacmanSpeed = Math.min(0.12 + this.level * 0.01, 0.2)
    this.ghostSpeed = Math.min(0.1 + this.level * 0.008, 0.18)
    this.frightenedDuration = Math.max(8000 - this.level * 500, 3000)

    this.resetLevel()
  }

  die() {
    this.audio.play('death')
    if (!this.loseLife()) return

    // Reset positions
    this.pacman.col = 10
    this.pacman.row = 16
    this.pacman.x = 10
    this.pacman.y = 16
    this.pacman.direction = { x: 0, y: 0 }
    this.pacman.nextDirection = { x: 0, y: 0 }
    this.createGhosts()
    this.mode = 'scatter'
    this.modeTimer = this.scatterDuration
  }

  render(ctx) {
    this.clear('#0a0a0f')

    const ts = this.tileSize

    // Draw maze
    ctx.fillStyle = '#1a1a7a'
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.maze[row][col] === 1) {
          ctx.fillRect(
            this.offsetX + col * ts,
            this.offsetY + row * ts,
            ts,
            ts,
          )
        }
      }
    }

    // Draw dots
    ctx.fillStyle = '#fff'
    for (const dot of this.dots) {
      if (!dot.eaten) {
        ctx.beginPath()
        ctx.arc(
          this.offsetX + dot.col * ts + ts / 2,
          this.offsetY + dot.row * ts + ts / 2,
          3,
          0,
          Math.PI * 2,
        )
        ctx.fill()
      }
    }

    // Draw power pellets
    ctx.fillStyle = '#fff'
    for (const pellet of this.powerPellets) {
      if (!pellet.eaten) {
        ctx.beginPath()
        ctx.arc(
          this.offsetX + pellet.col * ts + ts / 2,
          this.offsetY + pellet.row * ts + ts / 2,
          8,
          0,
          Math.PI * 2,
        )
        ctx.fill()
      }
    }

    // Draw fruit
    if (this.fruit) {
      ctx.fillStyle = '#ff2a6d'
      ctx.beginPath()
      ctx.arc(
        this.offsetX + this.fruit.col * ts + ts / 2,
        this.offsetY + this.fruit.row * ts + ts / 2,
        10,
        0,
        Math.PI * 2,
      )
      ctx.fill()
    }

    // Draw ghosts
    for (const ghost of this.ghosts) {
      this.drawGhost(ctx, ghost)
    }

    // Draw Pac-Man
    this.drawPacman(ctx)

    // HUD
    ctx.font = '16px monospace'
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'left'
    ctx.fillText(`SCORE: ${this.score}`, 10, 25)
    ctx.fillText(`LEVEL: ${this.level}`, 10, 50)
    ctx.textAlign = 'right'
    ctx.fillStyle = '#f9f871'
    let livesStr = ''
    for (let i = 0; i < this.lives; i++) livesStr += '● '
    ctx.fillText(livesStr, this.canvas.width - 10, 25)
  }

  drawPacman(ctx) {
    const pm = this.pacman
    const ts = this.tileSize
    const x = this.offsetX + pm.x * ts + ts / 2
    const y = this.offsetY + pm.y * ts + ts / 2

    // Direction angle
    let rotation = 0
    if (pm.direction.x === 1) rotation = 0
    if (pm.direction.x === -1) rotation = Math.PI
    if (pm.direction.y === -1) rotation = -Math.PI / 2
    if (pm.direction.y === 1) rotation = Math.PI / 2

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rotation)

    ctx.fillStyle = '#f9f871'
    ctx.beginPath()
    ctx.arc(0, 0, ts / 2 - 2, pm.mouthAngle, Math.PI * 2 - pm.mouthAngle)
    ctx.lineTo(0, 0)
    ctx.fill()

    ctx.restore()
  }

  drawGhost(ctx, ghost) {
    const ts = this.tileSize
    const x = this.offsetX + ghost.x * ts + ts / 2
    const y = this.offsetY + ghost.y * ts + ts / 2
    const r = ts / 2 - 2

    // Color
    if (ghost.eaten) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
    } else if (ghost.frightened) {
      // Flash when time running out
      if (this.modeTimer < 2000 && Math.floor(this.modeTimer / 200) % 2 === 0) {
        ctx.fillStyle = '#fff'
      } else {
        ctx.fillStyle = '#2a2aff'
      }
    } else {
      ctx.fillStyle = ghost.color
    }

    // Ghost body
    ctx.beginPath()
    ctx.arc(x, y - r * 0.2, r, Math.PI, 0)
    ctx.lineTo(x + r, y + r * 0.5)

    // Wavy bottom
    for (let i = 0; i < 4; i++) {
      const wx = x + r - (i + 0.5) * (r / 2)
      ctx.quadraticCurveTo(wx + r / 4, y + r, wx, y + r * 0.5)
    }

    ctx.closePath()
    ctx.fill()

    // Eyes
    if (!ghost.eaten) {
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(x - 4, y - 3, 5, 0, Math.PI * 2)
      ctx.arc(x + 4, y - 3, 5, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = ghost.frightened ? '#fff' : '#00f'
      ctx.beginPath()
      ctx.arc(
        x - 4 + ghost.direction.x * 2,
        y - 3 + ghost.direction.y * 2,
        2,
        0,
        Math.PI * 2,
      )
      ctx.arc(
        x + 4 + ghost.direction.x * 2,
        y - 3 + ghost.direction.y * 2,
        2,
        0,
        Math.PI * 2,
      )
      ctx.fill()
    }
  }
}
