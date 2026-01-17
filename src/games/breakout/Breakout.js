/**
 * Breakout Game - Classic brick-breaking arcade game
 * Bounce ball off paddle to destroy bricks, collect powerups, advance levels
 */
import { Game } from '../Game.js'

const BRICK_COLORS = [
  { color: '#ff2a6d', points: 70 }, // Red
  { color: '#ff2a6d', points: 70 },
  { color: '#ff6b35', points: 50 }, // Orange
  { color: '#ff6b35', points: 50 },
  { color: '#f9f871', points: 30 }, // Yellow
  { color: '#f9f871', points: 30 },
  { color: '#39ff14', points: 10 }, // Green
  { color: '#39ff14', points: 10 },
]

const POWERUP_TYPES = [
  { type: 'multiball', label: 'M', color: '#05d9e8' },
  { type: 'expand', label: 'E', color: '#39ff14' },
  { type: 'shrink', label: 'S', color: '#ff2a6d' },
  { type: 'slow', label: '↓', color: '#9d4edd' },
  { type: 'fast', label: '↑', color: '#ff6b35' },
  { type: 'life', label: '♥', color: '#ff2a6d' },
]

export class Breakout extends Game {
  static get config() {
    return {
      id: 'breakout',
      title: 'Breakout',
      description: 'Break all the bricks! Collect powerups!',
      thumbnail: '/assets/sprites/breakout-thumb.png',
      startLives: 3,
      highScoreType: 'highest',
      controls: {
        movement: 'Left/Right or A/D',
        action1: 'Launch ball',
        action2: 'Not used',
        pause: 'Escape',
      },
    }
  }

  async init() {
    await super.init()

    // Paddle settings
    this.paddleWidth = 100
    this.paddleHeight = 15
    this.paddleY = this.canvas.height - 50
    this.paddleSpeed = 10
    this.minPaddleWidth = 60
    this.maxPaddleWidth = 150

    // Ball settings
    this.ballRadius = 6
    this.ballBaseSpeed = 5
    this.ballSpeed = this.ballBaseSpeed

    // Brick settings
    this.brickRows = 8
    this.brickCols = 14
    this.brickWidth = 55
    this.brickHeight = 20
    this.brickGap = 2
    this.brickOffsetTop = 60
    this.brickOffsetLeft =
      (this.canvas.width - this.brickCols * (this.brickWidth + this.brickGap)) / 2

    // Game state
    this.paddle = { x: 0, width: this.paddleWidth }
    this.balls = []
    this.bricks = []
    this.powerups = []

    this.resetLevel()
  }

  resetLevel() {
    const { width } = this.canvas

    // Reset paddle
    this.paddle.x = width / 2 - this.paddleWidth / 2
    this.paddle.width = this.paddleWidth

    // Reset balls
    this.balls = [
      {
        x: width / 2,
        y: this.paddleY - this.ballRadius - 5,
        vx: 0,
        vy: 0,
        attached: true, // Ball attached to paddle until launched
      },
    ]

    // Adjust speed for level
    this.ballSpeed = this.ballBaseSpeed + (this.level - 1) * 0.5

    // Generate bricks
    this.generateBricks()

    // Clear powerups
    this.powerups = []
  }

  generateBricks() {
    this.bricks = []

    for (let row = 0; row < this.brickRows; row++) {
      for (let col = 0; col < this.brickCols; col++) {
        // Level-based patterns
        let shouldCreate = true
        if (this.level === 2) {
          shouldCreate = (row + col) % 2 === 0
        } else if (this.level === 3) {
          shouldCreate = row < 6 || col < 2 || col > 11
        } else if (this.level === 4) {
          const centerCol = this.brickCols / 2
          shouldCreate = Math.abs(col - centerCol) > row * 0.5
        } else if (this.level >= 5) {
          shouldCreate = Math.random() > 0.2
        }

        if (shouldCreate) {
          this.bricks.push({
            x: this.brickOffsetLeft + col * (this.brickWidth + this.brickGap),
            y: this.brickOffsetTop + row * (this.brickHeight + this.brickGap),
            width: this.brickWidth,
            height: this.brickHeight,
            color: BRICK_COLORS[row].color,
            points: BRICK_COLORS[row].points,
          })
        }
      }
    }
  }

  update(_deltaTime) {
    // Paddle movement
    const dir = this.input.getDirection()
    this.paddle.x += dir.x * this.paddleSpeed
    this.paddle.x = Math.max(0, Math.min(this.canvas.width - this.paddle.width, this.paddle.x))

    // Launch ball
    const attachedBall = this.balls.find((b) => b.attached)
    if (attachedBall) {
      attachedBall.x = this.paddle.x + this.paddle.width / 2

      if (this.input.isJustPressed('action1') || this.input.isJustPressed('start')) {
        attachedBall.attached = false
        attachedBall.vx = (Math.random() - 0.5) * 2
        attachedBall.vy = -this.ballSpeed
        this.audio.play('game-start')
      }
    }

    // Update balls
    this.balls = this.balls.filter((ball) => {
      if (ball.attached) return true
      return this.updateBall(ball)
    })

    // Check for lost all balls
    if (this.balls.length === 0) {
      if (!this.loseLife()) return // Game over
      this.resetBall()
    }

    // Update powerups
    this.updatePowerups()

    // Check level complete
    if (this.bricks.length === 0) {
      this.nextLevel()
      if (this.level > 5) {
        this.gameOver() // Won!
      } else {
        this.resetLevel()
      }
    }
  }

  updateBall(ball) {
    const { width, height } = this.canvas

    // Move ball
    ball.x += ball.vx
    ball.y += ball.vy

    // Wall collisions
    if (ball.x - this.ballRadius <= 0) {
      ball.x = this.ballRadius
      ball.vx = Math.abs(ball.vx)
      this.audio.play('hit')
    }
    if (ball.x + this.ballRadius >= width) {
      ball.x = width - this.ballRadius
      ball.vx = -Math.abs(ball.vx)
      this.audio.play('hit')
    }
    if (ball.y - this.ballRadius <= 0) {
      ball.y = this.ballRadius
      ball.vy = Math.abs(ball.vy)
      this.audio.play('hit')
    }

    // Bottom - ball lost
    if (ball.y > height) {
      return false // Remove ball
    }

    // Paddle collision
    if (
      ball.vy > 0 &&
      ball.y + this.ballRadius >= this.paddleY &&
      ball.y - this.ballRadius <= this.paddleY + this.paddleHeight &&
      ball.x >= this.paddle.x &&
      ball.x <= this.paddle.x + this.paddle.width
    ) {
      // Calculate angle based on hit position
      const hitPos = (ball.x - this.paddle.x) / this.paddle.width
      const angle = (hitPos - 0.5) * Math.PI * 0.7 // -63° to +63°
      const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy)

      ball.vx = Math.sin(angle) * speed
      ball.vy = -Math.abs(Math.cos(angle) * speed)
      ball.y = this.paddleY - this.ballRadius

      this.audio.play('hit')
    }

    // Brick collisions
    for (let i = this.bricks.length - 1; i >= 0; i--) {
      const brick = this.bricks[i]
      if (this.ballBrickCollision(ball, brick)) {
        this.bricks.splice(i, 1)
        this.addScore(brick.points)
        this.audio.play('hit')

        // Maybe spawn powerup
        if (Math.random() < 0.2) {
          this.spawnPowerup(brick.x + brick.width / 2, brick.y + brick.height)
        }
      }
    }

    return true
  }

  ballBrickCollision(ball, brick) {
    // Find closest point on brick to ball
    const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width))
    const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height))

    const dx = ball.x - closestX
    const dy = ball.y - closestY
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < this.ballRadius) {
      // Determine bounce direction
      if (Math.abs(dx) > Math.abs(dy)) {
        ball.vx = -ball.vx
      } else {
        ball.vy = -ball.vy
      }
      return true
    }
    return false
  }

  spawnPowerup(x, y) {
    const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)]
    this.powerups.push({
      x,
      y,
      vy: 2,
      ...type,
    })
  }

  updatePowerups() {
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const powerup = this.powerups[i]
      powerup.y += powerup.vy

      // Check paddle collision
      if (
        powerup.y >= this.paddleY &&
        powerup.y <= this.paddleY + this.paddleHeight &&
        powerup.x >= this.paddle.x &&
        powerup.x <= this.paddle.x + this.paddle.width
      ) {
        this.applyPowerup(powerup.type)
        this.powerups.splice(i, 1)
        this.audio.play('powerup')
        continue
      }

      // Remove if off screen
      if (powerup.y > this.canvas.height) {
        this.powerups.splice(i, 1)
      }
    }
  }

  applyPowerup(type) {
    switch (type) {
      case 'multiball':
        if (this.balls.length < 2) {
          const ball = this.balls.find((b) => !b.attached)
          if (ball) {
            this.balls.push({
              x: ball.x,
              y: ball.y,
              vx: -ball.vx,
              vy: ball.vy,
              attached: false,
            })
          }
        }
        break
      case 'expand':
        this.paddle.width = Math.min(this.maxPaddleWidth, this.paddle.width + 50)
        break
      case 'shrink':
        this.paddle.width = Math.max(this.minPaddleWidth, this.paddle.width - 40)
        break
      case 'slow':
        this.balls.forEach((ball) => {
          if (!ball.attached) {
            const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy)
            const newSpeed = speed * 0.7
            const angle = Math.atan2(ball.vy, ball.vx)
            ball.vx = Math.cos(angle) * newSpeed
            ball.vy = Math.sin(angle) * newSpeed
          }
        })
        break
      case 'fast':
        this.balls.forEach((ball) => {
          if (!ball.attached) {
            const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy)
            const newSpeed = speed * 1.3
            const angle = Math.atan2(ball.vy, ball.vx)
            ball.vx = Math.cos(angle) * newSpeed
            ball.vy = Math.sin(angle) * newSpeed
          }
        })
        break
      case 'life':
        this.lives++
        break
    }
  }

  resetBall() {
    this.balls = [
      {
        x: this.paddle.x + this.paddle.width / 2,
        y: this.paddleY - this.ballRadius - 5,
        vx: 0,
        vy: 0,
        attached: true,
      },
    ]
  }

  render(ctx) {
    this.clear('#0a0a0f')

    // Draw bricks
    for (const brick of this.bricks) {
      ctx.fillStyle = brick.color
      ctx.shadowColor = brick.color
      ctx.shadowBlur = 5
      ctx.fillRect(brick.x, brick.y, brick.width, brick.height)
    }
    ctx.shadowBlur = 0

    // Draw paddle
    ctx.fillStyle = '#05d9e8'
    ctx.shadowColor = '#05d9e8'
    ctx.shadowBlur = 10
    ctx.fillRect(this.paddle.x, this.paddleY, this.paddle.width, this.paddleHeight)
    ctx.shadowBlur = 0

    // Draw balls
    ctx.fillStyle = '#fff'
    ctx.shadowColor = '#fff'
    ctx.shadowBlur = 10
    for (const ball of this.balls) {
      ctx.beginPath()
      ctx.arc(ball.x, ball.y, this.ballRadius, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.shadowBlur = 0

    // Draw powerups
    for (const powerup of this.powerups) {
      ctx.fillStyle = powerup.color
      ctx.font = '16px "Press Start 2P"'
      ctx.textAlign = 'center'
      ctx.fillText(powerup.label, powerup.x, powerup.y)
    }

    // Draw HUD
    ctx.font = '12px "Press Start 2P"'
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'left'
    ctx.fillText(`SCORE: ${this.score}`, 10, 25)
    ctx.textAlign = 'center'
    ctx.fillText(`LEVEL ${this.level}`, this.canvas.width / 2, 25)
    ctx.textAlign = 'right'
    ctx.fillStyle = '#ff2a6d'
    let livesDisplay = ''
    for (let i = 0; i < this.lives; i++) livesDisplay += '♥ '
    ctx.fillText(livesDisplay, this.canvas.width - 10, 25)

    // Launch prompt
    if (this.balls.some((b) => b.attached)) {
      ctx.font = '12px "Press Start 2P"'
      ctx.fillStyle = '#7f8c8d'
      ctx.textAlign = 'center'
      ctx.fillText('PRESS SPACE TO LAUNCH', this.canvas.width / 2, this.canvas.height - 100)
    }
  }
}
