import { Game } from '../Game.js'

/**
 * Pong - Classic paddle game
 * First to 11 points wins!
 */
export class Pong extends Game {
  static get config() {
    return {
      id: 'pong',
      title: 'Pong',
      description: 'Classic paddle game. First to 11 wins!',
      thumbnail: '/assets/sprites/pong-thumb.png',
      startLives: 0, // Score-based, not lives
      highScoreType: 'highest',
      controls: {
        movement: 'W/S or Up/Down',
        action1: 'Start / Launch ball',
        action2: 'Not used',
        pause: 'Escape',
      },
    }
  }

  async init() {
    await super.init()

    // Game settings
    this.winScore = 11
    this.gameMode = 'ai' // 'ai' or 'human'
    this.aiDifficulty = 'medium' // 'easy', 'medium', 'hard'

    // Paddle settings
    this.paddleWidth = 15
    this.paddleHeight = 100
    this.paddleSpeed = 8
    this.paddleOffset = 30

    // Ball settings
    this.ballSize = 15
    this.ballBaseSpeed = 5
    this.ballSpeedIncrease = 0.5
    this.ballMaxSpeed = 15

    // Initialize state
    this.resetGame()
  }

  resetGame() {
    const { width, height } = this.canvas

    // Paddles
    this.paddle1 = {
      x: this.paddleOffset,
      y: height / 2 - this.paddleHeight / 2,
      score: 0,
    }

    this.paddle2 = {
      x: width - this.paddleOffset - this.paddleWidth,
      y: height / 2 - this.paddleHeight / 2,
      score: 0,
    }

    // Ball
    this.resetBall()

    // Game state
    this.gameStarted = false
    this.winner = null
  }

  resetBall(towardPlayer = null) {
    const { width, height } = this.canvas

    this.ball = {
      x: width / 2 - this.ballSize / 2,
      y: height / 2 - this.ballSize / 2,
      vx: 0,
      vy: 0,
      speed: this.ballBaseSpeed,
    }

    // Launch direction
    if (towardPlayer) {
      this.ball.vx = towardPlayer === 1 ? -this.ball.speed : this.ball.speed
    } else {
      this.ball.vx = Math.random() > 0.5 ? this.ball.speed : -this.ball.speed
    }
    this.ball.vy = (Math.random() - 0.5) * this.ball.speed
  }

  update(_deltaTime) {
    if (this.winner) return

    // Start game on action
    if (!this.gameStarted) {
      if (
        this.input.isJustPressed('action1') ||
        this.input.isJustPressed('start')
      ) {
        this.gameStarted = true
        this.resetBall()
        this.audio.play('game-start')
      }
      return
    }

    this.updatePaddles()
    this.updateBall()
    this.checkScore()
  }

  updatePaddles() {
    const { height } = this.canvas

    // Player 1 (W/S or Up/Down in 1-player)
    if (this.input.isPressed('up')) {
      this.paddle1.y -= this.paddleSpeed
    }
    if (this.input.isPressed('down')) {
      this.paddle1.y += this.paddleSpeed
    }

    // Clamp paddle 1
    this.paddle1.y = Math.max(
      0,
      Math.min(height - this.paddleHeight, this.paddle1.y),
    )

    // Player 2 or AI
    if (this.gameMode === 'human') {
      // Player 2 uses arrow keys (same as P1 for now - can be extended with separate key mapping)
      if (this.input.isPressed('up')) {
        this.paddle2.y -= this.paddleSpeed
      }
      if (this.input.isPressed('down')) {
        this.paddle2.y += this.paddleSpeed
      }
    } else {
      this.updateAI()
    }

    // Clamp paddle 2
    this.paddle2.y = Math.max(
      0,
      Math.min(height - this.paddleHeight, this.paddle2.y),
    )
  }

  updateAI() {
    const paddleCenter = this.paddle2.y + this.paddleHeight / 2
    const ballCenter = this.ball.y + this.ballSize / 2

    // AI speed based on difficulty
    const speeds = { easy: 3, medium: 5, hard: 7 }
    const aiSpeed = speeds[this.aiDifficulty]

    // Reaction delay for easy/medium
    const reactionChance = { easy: 0.7, medium: 0.9, hard: 1.0 }
    if (Math.random() > reactionChance[this.aiDifficulty]) return

    // Move toward ball
    if (ballCenter < paddleCenter - 10) {
      this.paddle2.y -= aiSpeed
    } else if (ballCenter > paddleCenter + 10) {
      this.paddle2.y += aiSpeed
    }
  }

  updateBall() {
    const { height } = this.canvas

    // Move ball
    this.ball.x += this.ball.vx
    this.ball.y += this.ball.vy

    // Bounce off top/bottom
    if (this.ball.y <= 0) {
      this.ball.y = 0
      this.ball.vy = -this.ball.vy
      this.audio.play('hit')
    }
    if (this.ball.y + this.ballSize >= height) {
      this.ball.y = height - this.ballSize
      this.ball.vy = -this.ball.vy
      this.audio.play('hit')
    }

    // Paddle collisions
    this.checkPaddleCollision(this.paddle1)
    this.checkPaddleCollision(this.paddle2)
  }

  checkPaddleCollision(paddle) {
    const ballRight = this.ball.x + this.ballSize
    const ballBottom = this.ball.y + this.ballSize
    const paddleRight = paddle.x + this.paddleWidth
    const paddleBottom = paddle.y + this.paddleHeight

    // Check overlap
    if (
      this.ball.x < paddleRight &&
      ballRight > paddle.x &&
      this.ball.y < paddleBottom &&
      ballBottom > paddle.y
    ) {
      // Determine which side was hit
      if (paddle === this.paddle1) {
        this.ball.x = paddleRight
        this.ball.vx = Math.abs(this.ball.vx)
      } else {
        this.ball.x = paddle.x - this.ballSize
        this.ball.vx = -Math.abs(this.ball.vx)
      }

      // Angle based on hit position
      const hitPos =
        (this.ball.y + this.ballSize / 2 - paddle.y) / this.paddleHeight
      const angle = ((hitPos - 0.5) * Math.PI) / 3 // -60° to +60°

      // Increase speed
      this.ball.speed = Math.min(
        this.ballMaxSpeed,
        this.ball.speed + this.ballSpeedIncrease,
      )

      // Apply new velocity
      const direction = this.ball.vx > 0 ? 1 : -1
      this.ball.vx = direction * Math.cos(angle) * this.ball.speed
      this.ball.vy = Math.sin(angle) * this.ball.speed

      this.audio.play('hit')
    }
  }

  checkScore() {
    const { width } = this.canvas

    // Ball passed left side (Player 2 scores, launch toward Player 2)
    if (this.ball.x + this.ballSize < 0) {
      this.paddle2.score++
      this.audio.play('score')
      this.checkWin() || this.resetBall(2)
    }

    // Ball passed right side (Player 1 scores, launch toward Player 1)
    if (this.ball.x > width) {
      this.paddle1.score++
      this.score = this.paddle1.score // For high score
      this.audio.play('score')
      this.checkWin() || this.resetBall(1)
    }
  }

  checkWin() {
    if (this.paddle1.score >= this.winScore) {
      this.winner = 1
      this.gameOver(this.paddle1.score)
      return true
    }
    if (this.paddle2.score >= this.winScore) {
      this.winner = 2
      this.gameOver(this.paddle1.score) // P1 score for high score
      return true
    }
    return false
  }

  render(ctx) {
    const { width, height } = this.canvas
    this.clear('#0a0a0f')

    // Center line
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 4
    ctx.setLineDash([20, 15])
    ctx.beginPath()
    ctx.moveTo(width / 2, 0)
    ctx.lineTo(width / 2, height)
    ctx.stroke()
    ctx.setLineDash([])

    // Scores
    ctx.font = '48px "Press Start 2P"'
    ctx.fillStyle = '#05d9e8'
    ctx.textAlign = 'center'
    ctx.fillText(this.paddle1.score.toString(), width / 4, 60)
    ctx.fillText(this.paddle2.score.toString(), (width * 3) / 4, 60)

    // Paddles
    ctx.fillStyle = '#fff'
    ctx.shadowColor = '#fff'
    ctx.shadowBlur = 10
    ctx.fillRect(
      this.paddle1.x,
      this.paddle1.y,
      this.paddleWidth,
      this.paddleHeight,
    )
    ctx.fillRect(
      this.paddle2.x,
      this.paddle2.y,
      this.paddleWidth,
      this.paddleHeight,
    )
    ctx.shadowBlur = 0

    // Ball
    ctx.fillStyle = '#f9f871'
    ctx.shadowColor = '#f9f871'
    ctx.shadowBlur = 15
    ctx.fillRect(this.ball.x, this.ball.y, this.ballSize, this.ballSize)
    ctx.shadowBlur = 0

    // Start prompt
    if (!this.gameStarted) {
      ctx.font = '16px "Press Start 2P"'
      ctx.fillStyle = '#7f8c8d'
      ctx.fillText('PRESS ENTER TO START', width / 2, height / 2 + 100)
    }

    // Winner
    if (this.winner) {
      ctx.font = '24px "Press Start 2P"'
      ctx.fillStyle = '#39ff14'
      ctx.fillText(`PLAYER ${this.winner} WINS!`, width / 2, height / 2)
    }
  }
}
