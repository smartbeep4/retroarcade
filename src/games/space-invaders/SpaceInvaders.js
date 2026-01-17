import { Game } from '../Game.js'

const ALIEN_TYPES = [
  { type: 'A', points: 30, color: '#ff2a6d' },
  { type: 'B', points: 20, color: '#f9f871' },
  { type: 'B', points: 20, color: '#f9f871' },
  { type: 'C', points: 10, color: '#39ff14' },
  { type: 'C', points: 10, color: '#39ff14' },
]

export class SpaceInvaders extends Game {
  static get config() {
    return {
      id: 'space-invaders',
      title: 'Space Invaders',
      description: 'Defend Earth from alien invasion!',
      thumbnail: '/assets/sprites/invaders-thumb.png',
      startLives: 3,
      highScoreType: 'highest',
      controls: {
        movement: 'Left/Right',
        action1: 'Fire (Space)',
      },
    }
  }

  async init() {
    await super.init()

    // Player settings
    this.playerWidth = 50
    this.playerHeight = 30
    this.playerSpeed = 5
    this.playerY = this.canvas.height - 60

    // Alien settings
    this.alienCols = 11
    this.alienRows = 5
    this.alienWidth = 40
    this.alienHeight = 30
    this.alienPadding = 10
    this.alienBaseSpeed = 1
    this.alienDropDistance = 30

    // Bullet settings
    this.bulletWidth = 4
    this.playerBulletHeight = 15
    this.alienBulletHeight = 10
    this.playerBulletSpeed = 8
    this.alienBulletSpeed = 4

    // Shield settings
    this.shieldCount = 4
    this.shieldWidth = 60
    this.shieldHeight = 40
    this.shieldY = this.canvas.height - 150

    // UFO settings
    this.ufoWidth = 50
    this.ufoHeight = 20
    this.ufoSpeed = 3
    this.ufoSpawnInterval = 20000 // 20 seconds

    // Game state
    this.player = { x: 0 }
    this.aliens = []
    this.alienDirection = 1
    this.alienSpeed = this.alienBaseSpeed
    this.alienMoveTimer = 0
    this.alienMoveInterval = 500
    this.playerBullet = null
    this.alienBullets = []
    this.shields = []
    this.ufo = null
    this.ufoTimer = 0
    this.wave = 1

    this.resetWave()
  }

  resetWave() {
    const { width } = this.canvas

    // Reset player position
    this.player.x = width / 2 - this.playerWidth / 2

    // Create aliens
    this.aliens = []
    const startX = (width - this.alienCols * (this.alienWidth + this.alienPadding)) / 2
    const startY = 80 + (this.wave - 1) * 20 // Lower each wave

    for (let row = 0; row < this.alienRows; row++) {
      for (let col = 0; col < this.alienCols; col++) {
        this.aliens.push({
          x: startX + col * (this.alienWidth + this.alienPadding),
          y: startY + row * (this.alienHeight + this.alienPadding),
          type: ALIEN_TYPES[row].type,
          points: ALIEN_TYPES[row].points,
          color: ALIEN_TYPES[row].color,
          alive: true,
        })
      }
    }

    // Reset alien movement
    this.alienDirection = 1
    this.alienSpeed = this.alienBaseSpeed + (this.wave - 1) * 0.3
    this.alienMoveInterval = Math.max(100, 500 - (this.wave - 1) * 50)
    this.alienMoveTimer = 0

    // Create shields (only on wave 1)
    if (this.wave === 1) {
      this.createShields()
    }

    // Clear bullets
    this.playerBullet = null
    this.alienBullets = []
    this.ufo = null
  }

  createShields() {
    this.shields = []
    const { width } = this.canvas
    const totalWidth = this.shieldCount * this.shieldWidth + (this.shieldCount - 1) * 80
    const startX = (width - totalWidth) / 2

    for (let i = 0; i < this.shieldCount; i++) {
      const shieldX = startX + i * (this.shieldWidth + 80)
      // Create shield as grid of small blocks
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 6; col++) {
          // Skip corners for shield shape
          if ((row === 0 && (col === 0 || col === 5)) || (row === 3 && col >= 2 && col <= 3)) {
            continue
          }
          this.shields.push({
            x: shieldX + col * 10,
            y: this.shieldY + row * 10,
            width: 10,
            height: 10,
          })
        }
      }
    }
  }

  update(deltaTime) {
    this.updatePlayer()
    this.updatePlayerBullet()
    this.updateAliens(deltaTime)
    this.updateAlienBullets()
    this.updateUFO(deltaTime)
    this.checkWaveComplete()
  }

  updatePlayer() {
    const { width } = this.canvas
    const dir = this.input.getDirection()

    this.player.x += dir.x * this.playerSpeed
    this.player.x = Math.max(0, Math.min(width - this.playerWidth, this.player.x))

    // Fire bullet
    if (
      (this.input.isJustPressed('action1') || this.input.isJustPressed('up')) &&
      !this.playerBullet
    ) {
      this.playerBullet = {
        x: this.player.x + this.playerWidth / 2 - this.bulletWidth / 2,
        y: this.playerY,
      }
      this.audio.play('shoot')
    }
  }

  updatePlayerBullet() {
    if (!this.playerBullet) return

    this.playerBullet.y -= this.playerBulletSpeed

    // Off screen
    if (this.playerBullet.y + this.playerBulletHeight < 0) {
      this.playerBullet = null
      return
    }

    // Check UFO collision
    if (
      this.ufo &&
      this.bulletHitsRect(
        this.playerBullet,
        this.playerBulletHeight,
        this.ufo,
        this.ufoWidth,
        this.ufoHeight
      )
    ) {
      this.addScore(this.ufo.points)
      this.audio.play('explosion')
      this.ufo = null
      this.playerBullet = null
      return
    }

    // Check alien collision
    for (const alien of this.aliens) {
      if (!alien.alive) continue
      if (
        this.bulletHitsRect(
          this.playerBullet,
          this.playerBulletHeight,
          alien,
          this.alienWidth,
          this.alienHeight
        )
      ) {
        alien.alive = false
        this.addScore(alien.points)
        this.audio.play('explosion')
        this.playerBullet = null
        this.updateAlienSpeed()
        return
      }
    }

    // Check shield collision
    this.checkBulletShieldCollision(this.playerBullet, this.playerBulletHeight)
  }

  updateAliens(deltaTime) {
    this.alienMoveTimer += deltaTime
    if (this.alienMoveTimer < this.alienMoveInterval) return
    this.alienMoveTimer = 0

    // Check if any alien hits edge
    let hitEdge = false
    const aliveAliens = this.aliens.filter((a) => a.alive)

    for (const alien of aliveAliens) {
      const nextX = alien.x + this.alienDirection * this.alienSpeed * 10
      if (nextX <= 0 || nextX + this.alienWidth >= this.canvas.width) {
        hitEdge = true
        break
      }
    }

    if (hitEdge) {
      // Drop down and reverse
      for (const alien of aliveAliens) {
        alien.y += this.alienDropDistance
      }
      this.alienDirection *= -1

      // Check if aliens reached player
      const lowestY = Math.max(...aliveAliens.map((a) => a.y))
      if (lowestY + this.alienHeight >= this.playerY) {
        this.gameOver()
        return
      }
    } else {
      // Move sideways
      for (const alien of aliveAliens) {
        alien.x += this.alienDirection * this.alienSpeed * 10
      }
    }

    // Random alien fires
    if (aliveAliens.length > 0 && Math.random() < 0.3) {
      const shooter = aliveAliens[Math.floor(Math.random() * aliveAliens.length)]
      this.alienBullets.push({
        x: shooter.x + this.alienWidth / 2 - this.bulletWidth / 2,
        y: shooter.y + this.alienHeight,
      })
    }
  }

  updateAlienSpeed() {
    const aliveCount = this.aliens.filter((a) => a.alive).length
    const totalCount = this.aliens.length
    const percentRemaining = aliveCount / totalCount

    // Speed up as fewer aliens remain
    this.alienMoveInterval = Math.max(50, 500 * percentRemaining)
  }

  updateAlienBullets() {
    for (let i = this.alienBullets.length - 1; i >= 0; i--) {
      const bullet = this.alienBullets[i]
      bullet.y += this.alienBulletSpeed

      // Off screen
      if (bullet.y > this.canvas.height) {
        this.alienBullets.splice(i, 1)
        continue
      }

      // Hit player
      if (
        this.bulletHitsRect(
          bullet,
          this.alienBulletHeight,
          this.player,
          this.playerWidth,
          this.playerHeight,
          this.playerY
        )
      ) {
        this.alienBullets.splice(i, 1)
        this.audio.play('death')
        if (!this.loseLife()) return
        continue
      }

      // Hit shield
      if (this.checkBulletShieldCollision(bullet, this.alienBulletHeight)) {
        this.alienBullets.splice(i, 1)
      }
    }
  }

  updateUFO(deltaTime) {
    // Spawn UFO
    this.ufoTimer += deltaTime
    if (!this.ufo && this.ufoTimer >= this.ufoSpawnInterval) {
      this.ufoTimer = 0
      const fromRight = Math.random() > 0.5
      this.ufo = {
        x: fromRight ? this.canvas.width : -this.ufoWidth,
        y: 30,
        direction: fromRight ? -1 : 1,
        points: [50, 100, 150, 200, 300][Math.floor(Math.random() * 5)],
      }
    }

    // Move UFO
    if (this.ufo) {
      this.ufo.x += this.ufo.direction * this.ufoSpeed
      if (this.ufo.x < -this.ufoWidth || this.ufo.x > this.canvas.width) {
        this.ufo = null
      }
    }
  }

  bulletHitsRect(bullet, bulletHeight, obj, objWidth, objHeight, objY = null) {
    const y = objY !== null ? objY : obj.y
    return (
      bullet.x < obj.x + objWidth &&
      bullet.x + this.bulletWidth > obj.x &&
      bullet.y < y + objHeight &&
      bullet.y + bulletHeight > y
    )
  }

  checkBulletShieldCollision(bullet, bulletHeight) {
    for (let i = this.shields.length - 1; i >= 0; i--) {
      const shield = this.shields[i]
      if (this.bulletHitsRect(bullet, bulletHeight, shield, shield.width, shield.height)) {
        this.shields.splice(i, 1)
        return true
      }
    }
    return false
  }

  checkWaveComplete() {
    if (this.aliens.every((a) => !a.alive)) {
      this.wave++
      this.audio.play('powerup')
      if (this.wave > 5) {
        // Victory!
        this.addScore(1000 * this.wave)
        this.gameOver()
      } else {
        this.resetWave()
      }
    }
  }

  render(ctx) {
    this.clear('#0a0a0f')

    // Stars background
    this.renderStars(ctx)

    // UFO
    if (this.ufo) {
      ctx.fillStyle = '#ff2a6d'
      ctx.shadowColor = '#ff2a6d'
      ctx.shadowBlur = 10
      this.drawUFO(ctx, this.ufo.x, this.ufo.y)
      ctx.shadowBlur = 0
    }

    // Aliens
    for (const alien of this.aliens) {
      if (!alien.alive) continue
      ctx.fillStyle = alien.color
      ctx.shadowColor = alien.color
      ctx.shadowBlur = 5
      this.drawAlien(ctx, alien.x, alien.y, alien.type)
    }
    ctx.shadowBlur = 0

    // Shields
    ctx.fillStyle = '#39ff14'
    for (const shield of this.shields) {
      ctx.fillRect(shield.x, shield.y, shield.width, shield.height)
    }

    // Player
    ctx.fillStyle = '#05d9e8'
    ctx.shadowColor = '#05d9e8'
    ctx.shadowBlur = 10
    this.drawPlayer(ctx)
    ctx.shadowBlur = 0

    // Player bullet
    if (this.playerBullet) {
      ctx.fillStyle = '#fff'
      ctx.fillRect(
        this.playerBullet.x,
        this.playerBullet.y,
        this.bulletWidth,
        this.playerBulletHeight
      )
    }

    // Alien bullets
    ctx.fillStyle = '#f9f871'
    for (const bullet of this.alienBullets) {
      ctx.fillRect(bullet.x, bullet.y, this.bulletWidth, this.alienBulletHeight)
    }

    // HUD
    ctx.font = '14px "Press Start 2P"'
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'left'
    ctx.fillText(`SCORE: ${this.score}`, 10, 25)
    ctx.textAlign = 'center'
    ctx.fillText(`WAVE ${this.wave}`, this.canvas.width / 2, 25)
    ctx.textAlign = 'right'
    ctx.fillStyle = '#ff2a6d'
    let livesStr = ''
    for (let i = 0; i < this.lives; i++) livesStr += '▲ '
    ctx.fillText(livesStr, this.canvas.width - 10, 25)
  }

  renderStars(ctx) {
    ctx.fillStyle = '#fff'
    // Static star pattern
    for (let i = 0; i < 50; i++) {
      const x = (i * 37) % this.canvas.width
      const y = (i * 73) % this.canvas.height
      ctx.fillRect(x, y, 2, 2)
    }
  }

  drawPlayer(ctx) {
    const { x } = this.player
    const y = this.playerY
    const w = this.playerWidth
    const h = this.playerHeight

    ctx.beginPath()
    ctx.moveTo(x + w / 2, y)
    ctx.lineTo(x + w, y + h)
    ctx.lineTo(x, y + h)
    ctx.closePath()
    ctx.fill()
  }

  drawAlien(ctx, x, y, type) {
    const w = this.alienWidth
    const h = this.alienHeight

    // Simple alien shapes
    if (type === 'A') {
      ctx.fillRect(x + 10, y, w - 20, h - 10)
      ctx.fillRect(x, y + 10, w, h - 10)
    } else if (type === 'B') {
      ctx.fillRect(x + 5, y, w - 10, h)
      ctx.fillRect(x, y + 5, w, h - 10)
    } else {
      ctx.fillRect(x, y, w, h)
      ctx.fillRect(x + 5, y + h - 5, 10, 5)
      ctx.fillRect(x + w - 15, y + h - 5, 10, 5)
    }
  }

  drawUFO(ctx, x, y) {
    ctx.beginPath()
    ctx.ellipse(
      x + this.ufoWidth / 2,
      y + this.ufoHeight / 2,
      this.ufoWidth / 2,
      this.ufoHeight / 2,
      0,
      0,
      Math.PI * 2
    )
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(
      x + this.ufoWidth / 2,
      y + this.ufoHeight / 3,
      this.ufoWidth / 4,
      this.ufoHeight / 3,
      0,
      0,
      Math.PI * 2
    )
    ctx.fill()
  }
}
