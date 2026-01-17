import { Game } from '../Game.js'

export class Flappy extends Game {
  static get config() {
    return {
      id: 'flappy',
      title: 'Flappy',
      description: 'Tap to fly! Avoid the pipes!',
      thumbnail: '/assets/sprites/flappy-thumb.png',
      startLives: 1,
      highScoreType: 'highest',
      controls: {
        movement: 'Not used',
        action1: 'Flap (Space / Tap)',
        action2: 'Not used',
        pause: 'Escape',
      },
    }
  }

  async init() {
    await super.init()

    // Bird settings
    this.birdWidth = 34
    this.birdHeight = 24
    this.birdX = this.canvas.width * 0.3

    // Physics
    this.gravity = 0.5
    this.flapStrength = -8
    this.terminalVelocity = 12

    // Pipe settings
    this.pipeWidth = 60
    this.pipeGap = 150
    this.pipeSpawnDistance = 200
    this.pipeSpeed = 3

    // Ground
    this.groundHeight = 80
    this.groundY = this.canvas.height - this.groundHeight

    // Game state
    this.bird = { y: 0, vy: 0, rotation: 0 }
    this.pipes = []
    this.groundOffset = 0
    this.bgOffset = 0
    this.started = false

    this.reset()
  }

  reset() {
    super.reset()

    this.bird = {
      y: this.canvas.height / 2,
      vy: 0,
      rotation: 0,
    }
    this.pipes = []
    this.groundOffset = 0
    this.bgOffset = 0
    this.started = false
    this.score = 0
  }

  update(_deltaTime) {
    // Start game on first flap
    if (!this.started) {
      if (this.input.isJustPressed('action1') || this.input.isJustPressed('up')) {
        this.started = true
        this.flap()
        this.audio.play('game-start')
      }
      return
    }

    // Flap on input
    if (this.input.isJustPressed('action1') || this.input.isJustPressed('up')) {
      this.flap()
    }

    // Apply physics
    this.bird.vy += this.gravity
    this.bird.vy = Math.min(this.bird.vy, this.terminalVelocity)
    this.bird.y += this.bird.vy

    // Rotation based on velocity
    this.bird.rotation = Math.min(Math.max(this.bird.vy * 3, -30), 90)

    // Check boundaries
    if (this.bird.y <= 0) {
      this.bird.y = 0
      this.die()
      return
    }
    if (this.bird.y + this.birdHeight >= this.groundY) {
      this.bird.y = this.groundY - this.birdHeight
      this.die()
      return
    }

    // Update pipes
    this.updatePipes()

    // Update scrolling
    this.groundOffset = (this.groundOffset + this.pipeSpeed) % 24
    this.bgOffset = (this.bgOffset + this.pipeSpeed * 0.5) % this.canvas.width
  }

  flap() {
    this.bird.vy = this.flapStrength
    this.audio.play('jump')
  }

  updatePipes() {
    // Move pipes
    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const pipe = this.pipes[i]
      pipe.x -= this.pipeSpeed

      // Check if bird passed pipe
      if (!pipe.scored && pipe.x + this.pipeWidth < this.birdX) {
        pipe.scored = true
        this.addScore(1)
      }

      // Check collision
      if (this.checkPipeCollision(pipe)) {
        this.die()
        return
      }

      // Remove off-screen pipes
      if (pipe.x + this.pipeWidth < 0) {
        this.pipes.splice(i, 1)
      }
    }

    // Spawn new pipes
    const lastPipe = this.pipes[this.pipes.length - 1]
    if (!lastPipe || lastPipe.x < this.canvas.width - this.pipeSpawnDistance) {
      this.spawnPipe()
    }
  }

  spawnPipe() {
    const minGapY = 100
    const maxGapY = this.groundY - this.pipeGap - 100
    const gapY = minGapY + Math.random() * (maxGapY - minGapY)

    this.pipes.push({
      x: this.canvas.width,
      gapY: gapY,
      scored: false,
    })
  }

  checkPipeCollision(pipe) {
    const birdLeft = this.birdX
    const birdRight = this.birdX + this.birdWidth
    const birdTop = this.bird.y
    const birdBottom = this.bird.y + this.birdHeight

    const pipeLeft = pipe.x
    const pipeRight = pipe.x + this.pipeWidth
    const gapTop = pipe.gapY
    const gapBottom = pipe.gapY + this.pipeGap

    // Check if bird overlaps with pipe horizontally
    if (birdRight > pipeLeft && birdLeft < pipeRight) {
      // Check if bird is outside the gap
      if (birdTop < gapTop || birdBottom > gapBottom) {
        return true
      }
    }

    return false
  }

  die() {
    this.audio.play('death')
    this.gameOver()
  }

  render(ctx) {
    const { width, height } = this.canvas

    // Sky background
    ctx.fillStyle = '#4dc3ff'
    ctx.fillRect(0, 0, width, height)

    // Clouds (parallax layer)
    this.renderClouds(ctx)

    // Pipes
    this.renderPipes(ctx)

    // Ground
    this.renderGround(ctx)

    // Bird
    this.renderBird(ctx)

    // Score
    ctx.font = '48px "Press Start 2P", monospace'
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 4
    ctx.textAlign = 'center'
    ctx.strokeText(this.score.toString(), width / 2, 80)
    ctx.fillText(this.score.toString(), width / 2, 80)

    // Start prompt
    if (!this.started) {
      ctx.font = '14px "Press Start 2P", monospace'
      ctx.fillStyle = '#fff'
      ctx.textAlign = 'center'
      ctx.strokeText('TAP TO START', width / 2, height / 2 + 50)
      ctx.fillText('TAP TO START', width / 2, height / 2 + 50)
    }
  }

  renderClouds(ctx) {
    ctx.fillStyle = '#fff'
    ctx.globalAlpha = 0.7
    // Simple cloud shapes that scroll slowly
    for (let i = 0; i < 3; i++) {
      const x = ((i * 300 - this.bgOffset + this.canvas.width) % (this.canvas.width + 200)) - 100
      ctx.beginPath()
      ctx.arc(x, 100, 30, 0, Math.PI * 2)
      ctx.arc(x + 25, 90, 25, 0, Math.PI * 2)
      ctx.arc(x + 50, 100, 28, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1.0
  }

  renderPipes(ctx) {
    for (const pipe of this.pipes) {
      // Pipe color
      ctx.fillStyle = '#39ff14'
      ctx.strokeStyle = '#2eb82e'
      ctx.lineWidth = 3

      // Top pipe
      const topPipeHeight = pipe.gapY
      ctx.fillRect(pipe.x, 0, this.pipeWidth, topPipeHeight)
      ctx.strokeRect(pipe.x, 0, this.pipeWidth, topPipeHeight)

      // Top pipe cap
      ctx.fillRect(pipe.x - 5, topPipeHeight - 30, this.pipeWidth + 10, 30)
      ctx.strokeRect(pipe.x - 5, topPipeHeight - 30, this.pipeWidth + 10, 30)

      // Bottom pipe
      const bottomPipeY = pipe.gapY + this.pipeGap
      const bottomPipeHeight = this.groundY - bottomPipeY
      ctx.fillRect(pipe.x, bottomPipeY, this.pipeWidth, bottomPipeHeight)
      ctx.strokeRect(pipe.x, bottomPipeY, this.pipeWidth, bottomPipeHeight)

      // Bottom pipe cap
      ctx.fillRect(pipe.x - 5, bottomPipeY, this.pipeWidth + 10, 30)
      ctx.strokeRect(pipe.x - 5, bottomPipeY, this.pipeWidth + 10, 30)
    }
  }

  renderGround(ctx) {
    // Ground base
    ctx.fillStyle = '#8b4513'
    ctx.fillRect(0, this.groundY, this.canvas.width, this.groundHeight)

    // Grass top
    ctx.fillStyle = '#39ff14'
    ctx.fillRect(0, this.groundY, this.canvas.width, 15)

    // Ground pattern (scrolling)
    ctx.fillStyle = '#654321'
    for (let x = -this.groundOffset; x < this.canvas.width; x += 24) {
      ctx.fillRect(x, this.groundY + 15, 12, 5)
    }
  }

  renderBird(ctx) {
    ctx.save()
    ctx.translate(this.birdX + this.birdWidth / 2, this.bird.y + this.birdHeight / 2)
    ctx.rotate((this.bird.rotation * Math.PI) / 180)

    // Bird body (yellow)
    ctx.fillStyle = '#f9f871'
    ctx.fillRect(-this.birdWidth / 2, -this.birdHeight / 2, this.birdWidth, this.birdHeight)

    // Wing
    ctx.fillStyle = '#fff'
    ctx.fillRect(-5, -2, 15, 10)

    // Eye
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(8, -3, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.arc(10, -3, 3, 0, Math.PI * 2)
    ctx.fill()

    // Beak
    ctx.fillStyle = '#ff6b35'
    ctx.beginPath()
    ctx.moveTo(this.birdWidth / 2 - 5, 0)
    ctx.lineTo(this.birdWidth / 2 + 8, 3)
    ctx.lineTo(this.birdWidth / 2 - 5, 6)
    ctx.fill()

    ctx.restore()
  }
}
