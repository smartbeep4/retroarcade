/**
 * Frogger - Classic arcade game
 * Help the frog cross the busy road and treacherous river!
 */
import { Game } from '../Game.js'

const LANE_CONFIG = [
  // Road lanes (bottom to top)
  { type: 'road', speed: 2, direction: 1, objects: ['car', 'car', 'car'] },
  { type: 'road', speed: 3, direction: -1, objects: ['truck', 'truck'] },
  {
    type: 'road',
    speed: 2,
    direction: 1,
    objects: ['car', 'car', 'car', 'car'],
  },
  { type: 'road', speed: 4, direction: -1, objects: ['car', 'car'] },
  {
    type: 'road',
    speed: 1,
    direction: 1,
    objects: ['truck', 'truck', 'truck'],
  },
  // River lanes
  { type: 'river', speed: 2, direction: -1, objects: ['log', 'log', 'log'] },
  {
    type: 'river',
    speed: 1,
    direction: 1,
    objects: ['turtle', 'turtle', 'turtle', 'turtle'],
  },
  { type: 'river', speed: 3, direction: -1, objects: ['log', 'log'] },
  {
    type: 'river',
    speed: 2,
    direction: 1,
    objects: ['turtle', 'turtle', 'turtle'],
  },
  { type: 'river', speed: 2, direction: -1, objects: ['log', 'log', 'log'] },
]

const OBJECT_SIZES = {
  car: { width: 60, height: 35 },
  truck: { width: 100, height: 35 },
  log: { width: 120, height: 35 },
  turtle: { width: 40, height: 35 },
}

export class Frogger extends Game {
  static get config() {
    return {
      id: 'frogger',
      title: 'Frogger',
      description: 'Help the frog cross safely!',
      thumbnail: '/assets/sprites/frogger-thumb.png',
      startLives: 3,
      highScoreType: 'highest',
      controls: {
        movement: 'Arrow keys or WASD (tap to hop)',
        action1: 'Not used',
        action2: 'Not used',
        pause: 'Escape',
      },
    }
  }

  async init() {
    await super.init()

    // Grid settings
    this.cellSize = 40
    this.cols = this.canvas.width / this.cellSize
    this.rows = this.canvas.height / this.cellSize

    // Zone layout
    this.startRow = this.rows - 1
    this.roadStartRow = this.rows - 2
    this.medianRow = this.rows - 7
    this.riverStartRow = this.rows - 8
    this.homeRow = 1

    // Frog settings
    this.frogSize = 35
    this.hopCooldown = 150
    this.hopTimer = 0

    // Timer
    this.maxTime = 30
    this.timeRemaining = this.maxTime

    // Game state
    this.frog = { col: 0, row: 0 }
    this.lanes = []
    this.homes = []
    this.round = 1
    this.furthestRow = this.startRow

    this.resetRound()
  }

  resetRound() {
    // Reset frog to start
    this.frog = {
      col: Math.floor(this.cols / 2),
      row: this.startRow,
      riding: null,
    }

    // Reset furthest row for this life
    this.furthestRow = this.startRow

    // Reset timer
    this.timeRemaining = this.maxTime

    // Initialize homes on first round
    if (this.round === 1) {
      this.homes = []
      for (let i = 0; i < 5; i++) {
        const col = 2 + i * 4 // Spaced across screen
        this.homes.push({
          col,
          filled: false,
          hasFly: Math.random() < 0.2,
        })
      }
    }

    // Create lanes
    this.createLanes()
  }

  createLanes() {
    this.lanes = []

    LANE_CONFIG.forEach((config, index) => {
      const row = this.roadStartRow - index
      const lane = {
        row,
        type: config.type,
        speed: config.speed,
        direction: config.direction,
        objects: [],
      }

      // Create objects for this lane
      const spacing = this.canvas.width / config.objects.length
      config.objects.forEach((objType, objIndex) => {
        const size = OBJECT_SIZES[objType]
        lane.objects.push({
          type: objType,
          x: objIndex * spacing + Math.random() * (spacing - size.width),
          width: size.width,
          height: size.height,
          diving: false,
          diveTimer: 0,
        })
      })

      this.lanes.push(lane)
    })
  }

  update(deltaTime) {
    if (this.state !== 'running') return

    // Update timer
    this.timeRemaining -= deltaTime / 1000
    if (this.timeRemaining <= 0) {
      this.die()
      return
    }

    // Update hop cooldown
    if (this.hopTimer > 0) {
      this.hopTimer -= deltaTime
    }

    // Handle input
    this.handleInput()

    // Update lanes
    this.updateLanes(deltaTime)

    // Check if frog is on river
    this.checkRiverInteraction()

    // Check collisions
    this.checkCollisions()

    // Check if reached home
    this.checkHome()
  }

  handleInput() {
    if (this.hopTimer > 0) return

    let moved = false

    if (this.input.isJustPressed('up')) {
      if (this.frog.row > 0) {
        this.frog.row--
        moved = true
        // Award points only for moving forward (upward)
        if (this.frog.row < this.furthestRow) {
          this.furthestRow = this.frog.row
          this.score += 10
        }
      }
    } else if (this.input.isJustPressed('down')) {
      if (this.frog.row < this.startRow) {
        this.frog.row++
        moved = true
      }
    } else if (this.input.isJustPressed('left')) {
      if (this.frog.col > 0) {
        this.frog.col--
        moved = true
      }
    } else if (this.input.isJustPressed('right')) {
      if (this.frog.col < this.cols - 1) {
        this.frog.col++
        moved = true
      }
    }

    if (moved) {
      this.hopTimer = this.hopCooldown
      this.audio.play('jump')
      this.frog.riding = null
    }
  }

  updateLanes(deltaTime) {
    for (const lane of this.lanes) {
      for (const obj of lane.objects) {
        // Move object
        obj.x += lane.speed * lane.direction

        // Wrap around
        if (lane.direction > 0 && obj.x > this.canvas.width) {
          obj.x = -obj.width
        } else if (lane.direction < 0 && obj.x + obj.width < 0) {
          obj.x = this.canvas.width
        }

        // Turtle diving
        if (obj.type === 'turtle') {
          obj.diveTimer += deltaTime
          if (obj.diveTimer > 3000) {
            obj.diving = !obj.diving
            obj.diveTimer = 0
          }
        }
      }
    }
  }

  checkRiverInteraction() {
    const frogY = this.frog.row

    // Check if on river
    const riverLane = this.lanes.find(
      (l) => l.row === frogY && l.type === 'river',
    )
    if (!riverLane) {
      this.frog.riding = null
      return
    }

    // Check if on a log or non-diving turtle
    const frogX = this.frog.col * this.cellSize + this.cellSize / 2

    for (const obj of riverLane.objects) {
      if (frogX >= obj.x && frogX <= obj.x + obj.width) {
        if (obj.type === 'turtle' && obj.diving) {
          continue // Can't ride diving turtle
        }
        // Riding this object
        this.frog.riding = { lane: riverLane, obj }

        // Move frog with object
        this.frog.col +=
          (riverLane.speed * riverLane.direction) / this.cellSize

        // Clamp to screen - die if pushed off edge
        if (this.frog.col < 0 || this.frog.col >= this.cols) {
          this.die()
        }
        return
      }
    }

    // Not on any object - drown!
    this.die()
  }

  checkCollisions() {
    const frogX = this.frog.col * this.cellSize
    const frogY = this.frog.row * this.cellSize
    const frogRight = frogX + this.frogSize
    const frogBottom = frogY + this.frogSize

    // Check road lanes
    for (const lane of this.lanes) {
      if (lane.type !== 'road' || lane.row !== this.frog.row) continue

      for (const obj of lane.objects) {
        const objY = lane.row * this.cellSize

        // Simple rectangle collision
        if (
          frogX < obj.x + obj.width &&
          frogRight > obj.x &&
          frogY < objY + obj.height &&
          frogBottom > objY
        ) {
          this.die()
          return
        }
      }
    }
  }

  checkHome() {
    if (this.frog.row !== this.homeRow) return

    for (const home of this.homes) {
      if (Math.abs(this.frog.col - home.col) <= 1) {
        if (home.filled) {
          this.die() // Can't enter filled home
          return
        }

        // Made it home!
        home.filled = true
        this.score += 50
        this.score += Math.floor(this.timeRemaining) * 10 // Time bonus

        if (home.hasFly) {
          this.score += 200
          home.hasFly = false
          this.audio.play('powerup')
        } else {
          this.audio.play('score')
        }

        // Check if all homes filled
        if (this.homes.every((h) => h.filled)) {
          this.completeRound()
        } else {
          this.resetFrog()
        }
        return
      }
    }

    // Landed between homes - death
    this.die()
  }

  resetFrog() {
    this.frog = {
      col: Math.floor(this.cols / 2),
      row: this.startRow,
      riding: null,
    }
    this.furthestRow = this.startRow
    this.timeRemaining = this.maxTime
  }

  completeRound() {
    this.round++
    this.score += 1000
    this.audio.play('powerup')

    // Reset homes
    this.homes.forEach((h) => {
      h.filled = false
      h.hasFly = Math.random() < 0.2
    })

    // Increase difficulty
    LANE_CONFIG.forEach((config) => {
      config.speed = Math.min(config.speed + 0.5, 6)
    })

    this.createLanes()
    this.resetFrog()
  }

  die() {
    this.audio.play('death')
    if (!this.loseLife()) return
    this.resetFrog()
  }

  render(ctx) {
    // Background
    this.clear('#0a0a0f')

    // Safe zones (start and median)
    ctx.fillStyle = '#2a2a4e'
    ctx.fillRect(
      0,
      this.startRow * this.cellSize,
      this.canvas.width,
      this.cellSize,
    )
    ctx.fillRect(
      0,
      this.medianRow * this.cellSize,
      this.canvas.width,
      this.cellSize,
    )

    // Road
    ctx.fillStyle = '#333'
    for (let row = this.roadStartRow; row > this.medianRow; row--) {
      ctx.fillRect(0, row * this.cellSize, this.canvas.width, this.cellSize)
    }

    // River
    ctx.fillStyle = '#1a4d7a'
    for (let row = this.riverStartRow; row > this.homeRow; row--) {
      ctx.fillRect(0, row * this.cellSize, this.canvas.width, this.cellSize)
    }

    // Home area
    ctx.fillStyle = '#1a4d2a'
    ctx.fillRect(0, 0, this.canvas.width, this.cellSize * 2)

    // Home slots
    for (const home of this.homes) {
      const x = home.col * this.cellSize
      ctx.fillStyle = home.filled ? '#39ff14' : '#0a2a0f'
      ctx.fillRect(
        x - 5,
        this.cellSize * 0.5,
        this.cellSize + 10,
        this.cellSize,
      )

      if (home.hasFly && !home.filled) {
        ctx.fillStyle = '#f9f871'
        ctx.fillRect(x + 10, this.cellSize * 0.7, 15, 15)
      }
    }

    // Lane objects
    for (const lane of this.lanes) {
      for (const obj of lane.objects) {
        const y = lane.row * this.cellSize + (this.cellSize - obj.height) / 2

        if (obj.type === 'car') {
          ctx.fillStyle = '#ff6b35'
        } else if (obj.type === 'truck') {
          ctx.fillStyle = '#9d4edd'
        } else if (obj.type === 'log') {
          ctx.fillStyle = '#8b4513'
        } else if (obj.type === 'turtle') {
          ctx.fillStyle = obj.diving ? '#1a4d7a' : '#39ff14'
          if (obj.diveTimer > 2500 && !obj.diving) {
            // Warning flash
            ctx.fillStyle = obj.diveTimer % 200 < 100 ? '#39ff14' : '#f9f871'
          }
        }

        ctx.fillRect(obj.x, y, obj.width, obj.height)
      }
    }

    // Frog
    const frogX =
      this.frog.col * this.cellSize + (this.cellSize - this.frogSize) / 2
    const frogY =
      this.frog.row * this.cellSize + (this.cellSize - this.frogSize) / 2
    ctx.fillStyle = '#39ff14'
    ctx.shadowColor = '#39ff14'
    ctx.shadowBlur = 10
    this.drawFrog(ctx, frogX, frogY)
    ctx.shadowBlur = 0

    // HUD
    ctx.font = '12px "Press Start 2P", monospace'
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'left'
    ctx.fillText(`SCORE: ${this.score}`, 10, 25)

    ctx.textAlign = 'center'
    ctx.fillText(`ROUND ${this.round}`, this.canvas.width / 2, 25)

    // Timer bar
    const timerWidth = 200
    const timerX = this.canvas.width - timerWidth - 10
    ctx.fillStyle = '#333'
    ctx.fillRect(timerX, 10, timerWidth, 15)
    ctx.fillStyle = this.timeRemaining < 10 ? '#ff2a6d' : '#39ff14'
    ctx.fillRect(
      timerX,
      10,
      (this.timeRemaining / this.maxTime) * timerWidth,
      15,
    )

    // Lives
    ctx.textAlign = 'right'
    ctx.fillStyle = '#39ff14'
    ctx.font = '10px "Press Start 2P", monospace'
    ctx.fillText(
      `LIVES: ${this.lives}`,
      this.canvas.width - 10,
      this.canvas.height - 10,
    )
  }

  drawFrog(ctx, x, y) {
    // Simple frog shape
    ctx.fillRect(x, y + 5, this.frogSize, this.frogSize - 10) // Body
    ctx.fillRect(x - 5, y, 10, 15) // Left leg
    ctx.fillRect(x + this.frogSize - 5, y, 10, 15) // Right leg
    ctx.fillRect(x + 5, y - 5, 8, 10) // Left eye
    ctx.fillRect(x + this.frogSize - 13, y - 5, 8, 10) // Right eye
  }
}
