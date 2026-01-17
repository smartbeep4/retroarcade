import { Game } from '../Game.js'

/**
 * Snake Game - Classic arcade snake implementation
 * Control a snake that grows longer as it eats food. Avoid hitting yourself!
 */
export class Snake extends Game {
  static get config() {
    return {
      id: 'snake',
      title: 'Snake',
      description: "Eat food, grow longer, don't hit yourself!",
      thumbnail: '/assets/sprites/snake-thumb.png',
      startLives: 1,
      highScoreType: 'highest',
      controls: {
        movement: 'Arrow keys or WASD',
        action1: 'Not used',
        action2: 'Not used',
        pause: 'Escape',
      },
    }
  }

  async init() {
    await super.init()

    // Grid settings
    this.gridSize = 20
    this.cellSize = this.canvas.width / this.gridSize

    // Snake state
    this.snake = []
    this.direction = { x: 1, y: 0 }
    this.nextDirection = { x: 1, y: 0 }
    this.food = null

    // Timing
    this.moveTimer = 0
    this.moveInterval = 150 // ms
    this.minInterval = 50
    this.foodEaten = 0

    // Settings
    this.wrapWalls = true

    this.resetSnake()
  }

  resetSnake() {
    // Start in center, 3 segments long
    const startX = Math.floor(this.gridSize / 2)
    const startY = Math.floor(this.gridSize / 2)

    this.snake = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
    ]

    this.direction = { x: 1, y: 0 }
    this.nextDirection = { x: 1, y: 0 }
    this.spawnFood()
  }

  spawnFood() {
    const emptyCells = []

    for (let x = 0; x < this.gridSize; x++) {
      for (let y = 0; y < this.gridSize; y++) {
        const isSnake = this.snake.some((s) => s.x === x && s.y === y)
        if (!isSnake) {
          emptyCells.push({ x, y })
        }
      }
    }

    if (emptyCells.length > 0) {
      const index = Math.floor(Math.random() * emptyCells.length)
      this.food = emptyCells[index]
    }
  }

  update(deltaTime) {
    // Handle input - queue direction change
    const dir = this.input.getDirection()

    // Prevent 180 degree turns
    if (dir.x !== 0 && this.direction.x === 0) {
      this.nextDirection = { x: dir.x, y: 0 }
    } else if (dir.y !== 0 && this.direction.y === 0) {
      this.nextDirection = { x: 0, y: dir.y }
    }

    // Move on timer
    this.moveTimer += deltaTime
    if (this.moveTimer >= this.moveInterval) {
      this.moveTimer = 0
      this.moveSnake()
    }
  }

  moveSnake() {
    // Apply queued direction
    this.direction = { ...this.nextDirection }

    // Calculate new head position
    const head = { ...this.snake[0] }
    head.x += this.direction.x
    head.y += this.direction.y

    // Handle walls
    if (this.wrapWalls) {
      head.x = (head.x + this.gridSize) % this.gridSize
      head.y = (head.y + this.gridSize) % this.gridSize
    } else {
      if (head.x < 0 || head.x >= this.gridSize || head.y < 0 || head.y >= this.gridSize) {
        this.gameOver()
        return
      }
    }

    // Check self collision
    if (this.snake.some((s) => s.x === head.x && s.y === head.y)) {
      this.gameOver()
      return
    }

    // Add new head
    this.snake.unshift(head)

    // Check food collision
    if (this.food && head.x === this.food.x && head.y === this.food.y) {
      this.eatFood()
    } else {
      // Remove tail if not eating
      this.snake.pop()
    }
  }

  eatFood() {
    this.foodEaten++

    // Add score points (don't use addScore because it plays sound)
    this.score += 10
    this.audio.play('score')

    // Speed up every 5 food
    if (this.foodEaten % 5 === 0) {
      this.moveInterval = Math.max(this.minInterval, this.moveInterval - 15)
      this.score += 5 // Bonus for speed increase
    }

    this.spawnFood()
  }

  render(ctx) {
    this.clear('#0a0a0f')

    // Draw grid lines (subtle)
    ctx.strokeStyle = '#1a1a2e'
    ctx.lineWidth = 1
    for (let i = 0; i <= this.gridSize; i++) {
      const pos = i * this.cellSize
      ctx.beginPath()
      ctx.moveTo(pos, 0)
      ctx.lineTo(pos, this.canvas.height)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, pos)
      ctx.lineTo(this.canvas.width, pos)
      ctx.stroke()
    }

    // Draw food
    if (this.food) {
      ctx.fillStyle = '#ff2a6d'
      ctx.shadowColor = '#ff2a6d'
      ctx.shadowBlur = 10
      this.drawCell(ctx, this.food.x, this.food.y)
      ctx.shadowBlur = 0
    }

    // Draw snake
    for (let i = 0; i < this.snake.length; i++) {
      const segment = this.snake[i]
      const isHead = i === 0

      if (isHead) {
        ctx.fillStyle = '#39ff14'
        ctx.shadowColor = '#39ff14'
        ctx.shadowBlur = 15
      } else {
        ctx.fillStyle = '#2eb82e'
        ctx.shadowBlur = 0
      }

      this.drawCell(ctx, segment.x, segment.y)
    }
    ctx.shadowBlur = 0

    // Draw score
    ctx.font = '16px "Press Start 2P"'
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'left'
    ctx.fillText(`Score: ${this.score}`, 10, 30)

    // Draw speed indicator
    const speedLevel = Math.floor((150 - this.moveInterval) / 15) + 1
    ctx.textAlign = 'right'
    ctx.fillText(`Speed: ${speedLevel}`, this.canvas.width - 10, 30)
  }

  drawCell(ctx, x, y) {
    const padding = 2
    ctx.fillRect(
      x * this.cellSize + padding,
      y * this.cellSize + padding,
      this.cellSize - padding * 2,
      this.cellSize - padding * 2
    )
  }
}
