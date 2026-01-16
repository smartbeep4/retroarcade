import { Game } from '../Game.js'

export class Asteroids extends Game {
  static get config() {
    return {
      id: 'asteroids',
      title: 'Asteroids',
      description: 'Blast through the asteroid field!',
      thumbnail: '/assets/sprites/asteroids-thumb.png',
      startLives: 3,
      highScoreType: 'highest',
      controls: {
        movement: 'Left/Right rotate, Up thrust',
        action1: 'Fire (Space)',
        action2: 'Hyperspace (Shift)',
        pause: 'Escape',
      },
    }
  }

  async init() {
    await super.init()

    // Ship settings
    this.shipSize = 20
    this.rotationSpeed = 0.1
    this.thrustPower = 0.15
    this.friction = 0.99
    this.maxSpeed = 8

    // Bullet settings
    this.bulletSpeed = 10
    this.bulletLifetime = 1500
    this.maxBullets = 4

    // Asteroid settings
    this.asteroidSizes = {
      large: { radius: 40, points: 20, speed: 1 },
      medium: { radius: 20, points: 50, speed: 2 },
      small: { radius: 10, points: 100, speed: 3 },
    }

    // UFO settings
    this.ufoSpawnInterval = 25000
    this.ufoTimer = 0

    // Game state
    this.ship = null
    this.asteroids = []
    this.bullets = []
    this.ufo = null
    this.ufoBullets = []
    this.wave = 1
    this.invincibleTimer = 0

    this.resetGame()
  }

  resetGame() {
    this.ship = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      vx: 0,
      vy: 0,
      rotation: -Math.PI / 2, // Pointing up
    }

    this.asteroids = []
    this.bullets = []
    this.ufo = null
    this.ufoBullets = []
    this.wave = 1
    this.invincibleTimer = 2000 // Brief invincibility at start

    this.spawnWave()
  }

  spawnWave() {
    const count = Math.min(4 + this.wave - 1, 10)

    for (let i = 0; i < count; i++) {
      this.spawnAsteroid('large')
    }
  }

  spawnAsteroid(size, x = null, y = null) {
    const config = this.asteroidSizes[size]
    const { width, height } = this.canvas

    // Spawn at edge if no position given
    if (x === null || y === null) {
      const edge = Math.floor(Math.random() * 4)
      switch (edge) {
        case 0:
          x = Math.random() * width
          y = 0
          break
        case 1:
          x = width
          y = Math.random() * height
          break
        case 2:
          x = Math.random() * width
          y = height
          break
        case 3:
          x = 0
          y = Math.random() * height
          break
      }
    }

    // Random velocity
    const angle = Math.random() * Math.PI * 2
    const speed = config.speed * (0.5 + Math.random() * 0.5)

    // Random shape (vertices)
    const vertices = []
    const numVertices = 8 + Math.floor(Math.random() * 5)
    for (let i = 0; i < numVertices; i++) {
      const a = (i / numVertices) * Math.PI * 2
      const r = config.radius * (0.7 + Math.random() * 0.3)
      vertices.push({ x: Math.cos(a) * r, y: Math.sin(a) * r })
    }

    this.asteroids.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.05,
      size,
      radius: config.radius,
      points: config.points,
      vertices,
    })
  }

  update(deltaTime) {
    // Update invincibility
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= deltaTime
    }

    this.handleInput()
    this.updateShip()
    this.updateBullets(deltaTime)
    this.updateAsteroids()
    this.updateUFO(deltaTime)
    this.checkCollisions()
    this.checkWaveComplete()
  }

  handleInput() {
    // Rotation
    if (this.input.isPressed('left')) {
      this.ship.rotation -= this.rotationSpeed
    }
    if (this.input.isPressed('right')) {
      this.ship.rotation += this.rotationSpeed
    }

    // Thrust
    if (this.input.isPressed('up')) {
      this.ship.vx += Math.cos(this.ship.rotation) * this.thrustPower
      this.ship.vy += Math.sin(this.ship.rotation) * this.thrustPower

      // Clamp speed
      const speed = Math.sqrt(
        this.ship.vx * this.ship.vx + this.ship.vy * this.ship.vy,
      )
      if (speed > this.maxSpeed) {
        this.ship.vx = (this.ship.vx / speed) * this.maxSpeed
        this.ship.vy = (this.ship.vy / speed) * this.maxSpeed
      }
    }

    // Fire
    if (
      this.input.isJustPressed('action1') &&
      this.bullets.length < this.maxBullets
    ) {
      this.fireBullet()
    }

    // Hyperspace
    if (this.input.isJustPressed('action2')) {
      this.hyperspace()
    }
  }

  updateShip() {
    // Apply friction
    this.ship.vx *= this.friction
    this.ship.vy *= this.friction

    // Move
    this.ship.x += this.ship.vx
    this.ship.y += this.ship.vy

    // Wrap around screen
    this.wrapPosition(this.ship)
  }

  fireBullet() {
    this.bullets.push({
      x: this.ship.x + Math.cos(this.ship.rotation) * this.shipSize,
      y: this.ship.y + Math.sin(this.ship.rotation) * this.shipSize,
      vx: Math.cos(this.ship.rotation) * this.bulletSpeed + this.ship.vx * 0.5,
      vy: Math.sin(this.ship.rotation) * this.bulletSpeed + this.ship.vy * 0.5,
      lifetime: this.bulletLifetime,
    })
    this.audio.play('shoot')
  }

  hyperspace() {
    this.ship.x = Math.random() * this.canvas.width
    this.ship.y = Math.random() * this.canvas.height
    this.ship.vx = 0
    this.ship.vy = 0
    this.invincibleTimer = 500 // Brief invincibility after hyperspace
    this.audio.play('powerup')
  }

  updateBullets(deltaTime) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i]

      // Move
      bullet.x += bullet.vx
      bullet.y += bullet.vy

      // Wrap
      this.wrapPosition(bullet)

      // Lifetime
      bullet.lifetime -= deltaTime
      if (bullet.lifetime <= 0) {
        this.bullets.splice(i, 1)
      }
    }

    // UFO bullets
    for (let i = this.ufoBullets.length - 1; i >= 0; i--) {
      const bullet = this.ufoBullets[i]
      bullet.x += bullet.vx
      bullet.y += bullet.vy
      this.wrapPosition(bullet)
      bullet.lifetime -= deltaTime
      if (bullet.lifetime <= 0) {
        this.ufoBullets.splice(i, 1)
      }
    }
  }

  updateAsteroids() {
    for (const asteroid of this.asteroids) {
      asteroid.x += asteroid.vx
      asteroid.y += asteroid.vy
      asteroid.rotation += asteroid.rotationSpeed
      this.wrapPosition(asteroid)
    }
  }

  updateUFO(deltaTime) {
    // Spawn UFO
    this.ufoTimer += deltaTime
    if (!this.ufo && this.ufoTimer >= this.ufoSpawnInterval) {
      this.ufoTimer = 0
      this.spawnUFO()
    }

    if (!this.ufo) return

    // Move UFO
    this.ufo.x += this.ufo.vx
    this.ufo.y += this.ufo.vy

    // UFO changes direction randomly
    this.ufo.directionTimer -= deltaTime
    if (this.ufo.directionTimer <= 0) {
      this.ufo.directionTimer = 1000 + Math.random() * 2000
      this.ufo.vy = (Math.random() - 0.5) * 3
    }

    // UFO fires
    this.ufo.fireTimer -= deltaTime
    if (this.ufo.fireTimer <= 0) {
      this.ufo.fireTimer = this.ufo.isSmall ? 1000 : 2000
      this.ufoFire()
    }

    // Remove if off screen
    if (this.ufo.x < -50 || this.ufo.x > this.canvas.width + 50) {
      this.ufo = null
    }
  }

  spawnUFO() {
    const isSmall = Math.random() < 0.3
    const fromLeft = Math.random() > 0.5

    this.ufo = {
      x: fromLeft ? -30 : this.canvas.width + 30,
      y: 50 + Math.random() * (this.canvas.height - 100),
      vx: fromLeft ? 2 : -2,
      vy: 0,
      isSmall,
      size: isSmall ? 15 : 25,
      points: isSmall ? 1000 : 200,
      directionTimer: 1000,
      fireTimer: 1000,
    }
  }

  ufoFire() {
    if (!this.ufo) return

    let angle
    if (this.ufo.isSmall) {
      // Accurate: aim at player
      angle = Math.atan2(this.ship.y - this.ufo.y, this.ship.x - this.ufo.x)
    } else {
      // Random direction
      angle = Math.random() * Math.PI * 2
    }

    this.ufoBullets.push({
      x: this.ufo.x,
      y: this.ufo.y,
      vx: Math.cos(angle) * 5,
      vy: Math.sin(angle) * 5,
      lifetime: 2000,
    })
  }

  checkCollisions() {
    // Bullets vs Asteroids
    for (let b = this.bullets.length - 1; b >= 0; b--) {
      const bullet = this.bullets[b]
      for (let a = this.asteroids.length - 1; a >= 0; a--) {
        const asteroid = this.asteroids[a]
        if (this.distance(bullet, asteroid) < asteroid.radius) {
          this.bullets.splice(b, 1)
          this.destroyAsteroid(a)
          break
        }
      }
    }

    // Bullets vs UFO
    if (this.ufo) {
      for (let b = this.bullets.length - 1; b >= 0; b--) {
        const bullet = this.bullets[b]
        if (this.distance(bullet, this.ufo) < this.ufo.size) {
          this.bullets.splice(b, 1)
          this.addScore(this.ufo.points)
          this.audio.play('explosion')
          this.ufo = null
          break
        }
      }
    }

    // Skip ship collisions if invincible
    if (this.invincibleTimer > 0) return

    // Ship vs Asteroids
    for (let a = this.asteroids.length - 1; a >= 0; a--) {
      const asteroid = this.asteroids[a]
      if (
        this.distance(this.ship, asteroid) <
        asteroid.radius + this.shipSize * 0.5
      ) {
        this.die()
        return
      }
    }

    // Ship vs UFO
    if (
      this.ufo &&
      this.distance(this.ship, this.ufo) < this.ufo.size + this.shipSize * 0.5
    ) {
      this.die()
      return
    }

    // Ship vs UFO bullets
    for (const bullet of this.ufoBullets) {
      if (this.distance(this.ship, bullet) < this.shipSize * 0.5) {
        this.die()
        return
      }
    }
  }

  destroyAsteroid(index) {
    const asteroid = this.asteroids[index]
    this.asteroids.splice(index, 1)
    this.addScore(asteroid.points)
    this.audio.play('explosion')

    // Split into smaller asteroids
    if (asteroid.size === 'large') {
      this.spawnAsteroid('medium', asteroid.x, asteroid.y)
      this.spawnAsteroid('medium', asteroid.x, asteroid.y)
    } else if (asteroid.size === 'medium') {
      this.spawnAsteroid('small', asteroid.x, asteroid.y)
      this.spawnAsteroid('small', asteroid.x, asteroid.y)
    }
  }

  checkWaveComplete() {
    if (this.asteroids.length === 0) {
      this.wave++
      this.audio.play('powerup')
      this.spawnWave()
    }
  }

  die() {
    this.audio.play('death')
    if (!this.loseLife()) return

    // Reset ship position
    this.ship.x = this.canvas.width / 2
    this.ship.y = this.canvas.height / 2
    this.ship.vx = 0
    this.ship.vy = 0
    this.ship.rotation = -Math.PI / 2
    this.invincibleTimer = 3000
  }

  distance(a, b) {
    const dx = a.x - b.x
    const dy = a.y - b.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  wrapPosition(obj) {
    const { width, height } = this.canvas
    const margin = 50

    if (obj.x < -margin) obj.x = width + margin
    if (obj.x > width + margin) obj.x = -margin
    if (obj.y < -margin) obj.y = height + margin
    if (obj.y > height + margin) obj.y = -margin
  }

  render(ctx) {
    this.clear('#0a0a0f')

    // Stars
    ctx.fillStyle = '#333'
    for (let i = 0; i < 30; i++) {
      const x = (i * 47) % this.canvas.width
      const y = (i * 83) % this.canvas.height
      ctx.fillRect(x, y, 2, 2)
    }

    // Set vector style
    ctx.strokeStyle = '#05d9e8'
    ctx.lineWidth = 2
    ctx.shadowColor = '#05d9e8'
    ctx.shadowBlur = 10

    // Draw asteroids
    for (const asteroid of this.asteroids) {
      this.drawAsteroid(ctx, asteroid)
    }

    // Draw bullets
    ctx.fillStyle = '#fff'
    for (const bullet of this.bullets) {
      ctx.beginPath()
      ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2)
      ctx.fill()
    }

    // Draw UFO bullets
    ctx.fillStyle = '#ff2a6d'
    for (const bullet of this.ufoBullets) {
      ctx.beginPath()
      ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2)
      ctx.fill()
    }

    // Draw UFO
    if (this.ufo) {
      this.drawUFO(ctx)
    }

    // Draw ship
    if (
      this.invincibleTimer <= 0 ||
      Math.floor(this.invincibleTimer / 100) % 2 === 0
    ) {
      this.drawShip(ctx)
    }

    ctx.shadowBlur = 0

    // HUD
    ctx.font = '14px "Press Start 2P"'
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'left'
    ctx.fillText(`SCORE: ${this.score}`, 10, 30)
    ctx.textAlign = 'center'
    ctx.fillText(`WAVE ${this.wave}`, this.canvas.width / 2, 30)
    ctx.textAlign = 'right'
    for (let i = 0; i < this.lives; i++) {
      this.drawMiniShip(ctx, this.canvas.width - 30 - i * 25, 25)
    }
  }

  drawShip(ctx) {
    ctx.save()
    ctx.translate(this.ship.x, this.ship.y)
    ctx.rotate(this.ship.rotation)

    ctx.strokeStyle = '#05d9e8'
    ctx.beginPath()
    ctx.moveTo(this.shipSize, 0)
    ctx.lineTo(-this.shipSize * 0.7, -this.shipSize * 0.6)
    ctx.lineTo(-this.shipSize * 0.4, 0)
    ctx.lineTo(-this.shipSize * 0.7, this.shipSize * 0.6)
    ctx.closePath()
    ctx.stroke()

    // Thrust flame
    if (this.input.isPressed('up')) {
      ctx.strokeStyle = '#ff6b35'
      ctx.beginPath()
      ctx.moveTo(-this.shipSize * 0.4, -this.shipSize * 0.3)
      ctx.lineTo(-this.shipSize * 0.9, 0)
      ctx.lineTo(-this.shipSize * 0.4, this.shipSize * 0.3)
      ctx.stroke()
    }

    ctx.restore()
  }

  drawMiniShip(ctx, x, y) {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(-Math.PI / 2)
    ctx.strokeStyle = '#05d9e8'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(8, 0)
    ctx.lineTo(-5, -4)
    ctx.lineTo(-3, 0)
    ctx.lineTo(-5, 4)
    ctx.closePath()
    ctx.stroke()
    ctx.restore()
  }

  drawAsteroid(ctx, asteroid) {
    ctx.save()
    ctx.translate(asteroid.x, asteroid.y)
    ctx.rotate(asteroid.rotation)

    ctx.strokeStyle = '#7f8c8d'
    ctx.beginPath()
    ctx.moveTo(asteroid.vertices[0].x, asteroid.vertices[0].y)
    for (let i = 1; i < asteroid.vertices.length; i++) {
      ctx.lineTo(asteroid.vertices[i].x, asteroid.vertices[i].y)
    }
    ctx.closePath()
    ctx.stroke()

    ctx.restore()
  }

  drawUFO(ctx) {
    const { x, y, size } = this.ufo
    ctx.strokeStyle = '#ff2a6d'
    ctx.beginPath()
    ctx.ellipse(x, y, size, size * 0.4, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.ellipse(x, y - size * 0.2, size * 0.5, size * 0.3, 0, 0, Math.PI * 2)
    ctx.stroke()
  }
}
