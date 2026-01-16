import { Game } from '../Game.js'

const TETROMINOES = {
  I: {
    shape: [[1, 1, 1, 1]],
    color: '#05d9e8',
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: '#f9f871',
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    color: '#9d4edd',
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: '#39ff14',
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: '#ff2a6d',
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
    ],
    color: '#4d79ff',
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
    ],
    color: '#ff6b35',
  },
}

const PIECE_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']

export class Tetris extends Game {
  static get config() {
    return {
      id: 'tetris',
      title: 'Tetris',
      description: 'The classic block puzzle!',
      thumbnail: '/assets/sprites/tetris-thumb.png',
      startLives: 1,
      highScoreType: 'highest',
      controls: {
        movement: 'Left/Right to move, Down to soft drop',
        action1: 'Rotate (Up/Z)',
        action2: 'Hold piece (C)',
        pause: 'Escape',
      },
    }
  }

  async init() {
    await super.init()

    // Grid settings
    this.cols = 10
    this.rows = 20
    this.cellSize = 30

    // Calculate positions
    this.gridOffsetX = (this.canvas.width - this.cols * this.cellSize) / 2
    this.gridOffsetY = 50

    // Timing
    this.baseDropInterval = 1000 // 1 second at level 1
    this.dropInterval = this.baseDropInterval
    this.dropTimer = 0
    this.lockDelay = 500
    this.lockTimer = 0

    // Input timing
    this.moveDelay = 100
    this.moveTimer = 0
    this.lastMoveDir = 0

    // Game state
    this.grid = []
    this.currentPiece = null
    this.nextQueue = []
    this.holdPiece = null
    this.canHold = true
    this.linesCleared = 0

    this.resetGame()
  }

  resetGame() {
    // Clear grid
    this.grid = Array(this.rows)
      .fill(null)
      .map(() => Array(this.cols).fill(null))

    // Fill next queue
    this.nextQueue = []
    for (let i = 0; i < 3; i++) {
      this.nextQueue.push(this.randomPiece())
    }

    // Spawn first piece
    this.spawnPiece()

    // Reset state
    this.holdPiece = null
    this.canHold = true
    this.level = 1
    this.linesCleared = 0
    this.score = 0
    this.dropTimer = 0
    this.lockTimer = 0
    this.updateDropSpeed()
  }

  randomPiece() {
    return PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)]
  }

  spawnPiece() {
    const type = this.nextQueue.shift()
    this.nextQueue.push(this.randomPiece())

    const tetromino = TETROMINOES[type]
    this.currentPiece = {
      type,
      shape: tetromino.shape.map((row) => [...row]),
      color: tetromino.color,
      x: Math.floor((this.cols - tetromino.shape[0].length) / 2),
      y: 0,
    }

    // Check game over
    if (this.checkCollision(this.currentPiece.x, this.currentPiece.y)) {
      this.gameOver()
    }

    this.canHold = true
    this.lockTimer = 0
  }

  update(deltaTime) {
    if (this.state !== 'running') return

    // Handle input
    this.handleInput(deltaTime)

    // Gravity
    this.dropTimer += deltaTime
    if (this.dropTimer >= this.dropInterval) {
      this.dropTimer = 0
      this.moveDown()
    }

    // Lock delay
    if (this.isOnGround()) {
      this.lockTimer += deltaTime
      if (this.lockTimer >= this.lockDelay) {
        this.lockPiece()
      }
    } else {
      this.lockTimer = 0
    }
  }

  handleInput(deltaTime) {
    if (!this.currentPiece) return

    this.moveTimer += deltaTime

    // Movement (with repeat)
    const leftPressed = this.input.isPressed('left')
    const rightPressed = this.input.isPressed('right')

    if (leftPressed && this.moveTimer >= this.moveDelay) {
      this.moveHorizontal(-1)
      this.moveTimer = 0
      this.lastMoveDir = -1
    } else if (rightPressed && this.moveTimer >= this.moveDelay) {
      this.moveHorizontal(1)
      this.moveTimer = 0
      this.lastMoveDir = 1
    }

    // Reset move timer if keys released
    if (!leftPressed && !rightPressed) {
      this.moveTimer = 0
      this.lastMoveDir = 0
    }

    // Soft drop
    if (this.input.isPressed('down')) {
      this.dropTimer = this.dropInterval // Force drop next frame
    }

    // Rotate - check for Up key or action1 (Z key)
    if (this.input.isJustPressed('up') || this.input.isJustPressed('action1')) {
      this.rotate()
    }

    // Hard drop - Space key
    if (this.input.isJustPressed('space')) {
      this.hardDrop()
    }

    // Hold - action2 (C key)
    if (this.input.isJustPressed('action2')) {
      this.hold()
    }
  }

  moveHorizontal(dir) {
    const newX = this.currentPiece.x + dir
    if (!this.checkCollision(newX, this.currentPiece.y)) {
      this.currentPiece.x = newX
      this.lockTimer = 0 // Reset lock timer on move
      return true
    }
    return false
  }

  moveDown() {
    const newY = this.currentPiece.y + 1
    if (!this.checkCollision(this.currentPiece.x, newY)) {
      this.currentPiece.y = newY
      return true
    }
    return false
  }

  hardDrop() {
    let cellsDropped = 0
    while (this.moveDown()) {
      cellsDropped++
    }
    if (cellsDropped > 0) {
      this.score += cellsDropped * 2 // Bonus for hard drop
    }
    this.lockPiece()
  }

  rotate() {
    const rotated = this.rotateMatrix(this.currentPiece.shape)

    // Try rotation at current position
    if (
      !this.checkCollisionWithShape(
        rotated,
        this.currentPiece.x,
        this.currentPiece.y,
      )
    ) {
      this.currentPiece.shape = rotated
      this.lockTimer = 0
      this.audio.play('hit')
      return
    }

    // Wall kick: try shifting left/right
    for (const kick of [-1, 1, -2, 2]) {
      if (
        !this.checkCollisionWithShape(
          rotated,
          this.currentPiece.x + kick,
          this.currentPiece.y,
        )
      ) {
        this.currentPiece.shape = rotated
        this.currentPiece.x += kick
        this.lockTimer = 0
        this.audio.play('hit')
        return
      }
    }
  }

  rotateMatrix(matrix) {
    const rows = matrix.length
    const cols = matrix[0].length
    const rotated = Array(cols)
      .fill(null)
      .map(() => Array(rows).fill(0))

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        rotated[c][rows - 1 - r] = matrix[r][c]
      }
    }

    return rotated
  }

  hold() {
    if (!this.canHold) return

    const currentType = this.currentPiece.type

    if (this.holdPiece) {
      // Swap with hold
      const tetromino = TETROMINOES[this.holdPiece]
      this.currentPiece = {
        type: this.holdPiece,
        shape: tetromino.shape.map((row) => [...row]),
        color: tetromino.color,
        x: Math.floor((this.cols - tetromino.shape[0].length) / 2),
        y: 0,
      }
      this.holdPiece = currentType
    } else {
      // First hold
      this.holdPiece = currentType
      this.spawnPiece()
    }

    this.canHold = false
    this.lockTimer = 0
    this.audio.play('hit')
  }

  checkCollision(x, y) {
    return this.checkCollisionWithShape(this.currentPiece.shape, x, y)
  }

  checkCollisionWithShape(shape, x, y) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue

        const newX = x + c
        const newY = y + r

        // Boundary check
        if (newX < 0 || newX >= this.cols || newY >= this.rows) {
          return true
        }

        // Grid collision
        if (newY >= 0 && this.grid[newY][newX]) {
          return true
        }
      }
    }
    return false
  }

  isOnGround() {
    return this.checkCollision(this.currentPiece.x, this.currentPiece.y + 1)
  }

  lockPiece() {
    // Add piece to grid
    const { shape, x, y, color } = this.currentPiece
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] && y + r >= 0) {
          this.grid[y + r][x + c] = color
        }
      }
    }

    this.audio.play('hit')

    // Clear lines
    this.clearLines()

    // Spawn next piece
    this.spawnPiece()
  }

  clearLines() {
    let linesCleared = 0

    for (let r = this.rows - 1; r >= 0; r--) {
      if (this.grid[r].every((cell) => cell !== null)) {
        // Remove line
        this.grid.splice(r, 1)
        this.grid.unshift(Array(this.cols).fill(null))
        linesCleared++
        r++ // Recheck this row
      }
    }

    if (linesCleared > 0) {
      this.linesCleared += linesCleared

      // Score based on lines cleared
      const points = [0, 100, 300, 500, 800][linesCleared] * this.level
      this.addScore(points)

      // Level up every 10 lines
      const newLevel = Math.floor(this.linesCleared / 10) + 1
      if (newLevel > this.level) {
        this.level = newLevel
        this.updateDropSpeed()
        this.audio.play('powerup')
      } else {
        this.audio.play('score')
      }
    }
  }

  updateDropSpeed() {
    this.dropInterval = this.baseDropInterval * Math.pow(0.85, this.level - 1)
  }

  getGhostY() {
    if (!this.currentPiece) return 0
    let ghostY = this.currentPiece.y
    while (!this.checkCollision(this.currentPiece.x, ghostY + 1)) {
      ghostY++
    }
    return ghostY
  }

  render(ctx) {
    this.clear('#0a0a0f')

    // Draw grid background
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(
      this.gridOffsetX,
      this.gridOffsetY,
      this.cols * this.cellSize,
      this.rows * this.cellSize,
    )

    // Draw grid lines
    ctx.strokeStyle = '#2a2a4e'
    ctx.lineWidth = 1
    for (let x = 0; x <= this.cols; x++) {
      ctx.beginPath()
      ctx.moveTo(this.gridOffsetX + x * this.cellSize, this.gridOffsetY)
      ctx.lineTo(
        this.gridOffsetX + x * this.cellSize,
        this.gridOffsetY + this.rows * this.cellSize,
      )
      ctx.stroke()
    }
    for (let y = 0; y <= this.rows; y++) {
      ctx.beginPath()
      ctx.moveTo(this.gridOffsetX, this.gridOffsetY + y * this.cellSize)
      ctx.lineTo(
        this.gridOffsetX + this.cols * this.cellSize,
        this.gridOffsetY + y * this.cellSize,
      )
      ctx.stroke()
    }

    // Draw locked pieces
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c]) {
          this.drawCell(ctx, c, r, this.grid[r][c])
        }
      }
    }

    // Draw ghost piece
    if (this.currentPiece) {
      const ghostY = this.getGhostY()
      ctx.globalAlpha = 0.3
      this.drawPiece(
        ctx,
        this.currentPiece.shape,
        this.currentPiece.x,
        ghostY,
        this.currentPiece.color,
      )
      ctx.globalAlpha = 1

      // Draw current piece
      this.drawPiece(
        ctx,
        this.currentPiece.shape,
        this.currentPiece.x,
        this.currentPiece.y,
        this.currentPiece.color,
      )
    }

    // Draw UI
    this.renderUI(ctx)

    // Draw pause overlay if paused
    if (this.state === 'paused') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
      ctx.fillStyle = '#fff'
      ctx.font = '24px "Press Start 2P", monospace'
      ctx.textAlign = 'center'
      ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2)
    }

    // Draw game over overlay if game over
    if (this.state === 'gameover') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
      ctx.fillStyle = '#fff'
      ctx.font = '24px "Press Start 2P", monospace'
      ctx.textAlign = 'center'
      ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2)
      ctx.font = '12px "Press Start 2P", monospace'
      ctx.fillText(
        `Score: ${this.score}`,
        this.canvas.width / 2,
        this.canvas.height / 2 + 40,
      )
    }
  }

  drawCell(ctx, x, y, color) {
    const cellX = this.gridOffsetX + x * this.cellSize
    const cellY = this.gridOffsetY + y * this.cellSize

    ctx.fillStyle = color
    ctx.shadowColor = color
    ctx.shadowBlur = 5
    ctx.fillRect(cellX + 2, cellY + 2, this.cellSize - 4, this.cellSize - 4)
    ctx.shadowBlur = 0

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.fillRect(cellX + 2, cellY + 2, this.cellSize - 4, 4)
  }

  drawPiece(ctx, shape, x, y, color) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          this.drawCell(ctx, x + c, y + r, color)
        }
      }
    }
  }

  renderUI(ctx) {
    const rightX = this.gridOffsetX + this.cols * this.cellSize + 30
    const leftX = this.gridOffsetX - 120

    // Next pieces
    ctx.font = '12px "Press Start 2P", monospace'
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'left'
    ctx.fillText('NEXT', rightX, 70)

    for (let i = 0; i < this.nextQueue.length; i++) {
      const type = this.nextQueue[i]
      const tetromino = TETROMINOES[type]
      const y = 90 + i * 80
      this.drawMiniPiece(ctx, tetromino.shape, rightX, y, tetromino.color)
    }

    // Hold piece
    ctx.fillText('HOLD', leftX, 70)
    if (this.holdPiece) {
      const tetromino = TETROMINOES[this.holdPiece]
      ctx.globalAlpha = this.canHold ? 1 : 0.5
      this.drawMiniPiece(ctx, tetromino.shape, leftX, 90, tetromino.color)
      ctx.globalAlpha = 1
    }

    // Score
    ctx.fillText('SCORE', leftX, 200)
    ctx.fillText(this.score.toString(), leftX, 225)

    // Level
    ctx.fillText('LEVEL', leftX, 280)
    ctx.fillText(this.level.toString(), leftX, 305)

    // Lines
    ctx.fillText('LINES', leftX, 360)
    ctx.fillText(this.linesCleared.toString(), leftX, 385)
  }

  drawMiniPiece(ctx, shape, x, y, color) {
    const miniSize = 15
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          ctx.fillStyle = color
          ctx.fillRect(
            x + c * miniSize,
            y + r * miniSize,
            miniSize - 2,
            miniSize - 2,
          )
        }
      }
    }
  }
}
