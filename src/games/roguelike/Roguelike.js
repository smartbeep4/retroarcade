/**
 * Roguelike Game - Procedurally generated dungeon crawler
 * Features: 5 floors, multiple enemy types, combat, items, FOV, permadeath
 */
import { Game } from '../Game.js'

const TILES = {
  FLOOR: 0,
  WALL: 1,
  DOOR: 2,
  STAIRS: 3,
  CHEST: 4,
}

const ENEMY_TYPES = {
  rat: { name: 'Rat', hp: 3, damage: 1, speed: 2, color: '#8b4513', exp: 10 },
  bat: { name: 'Bat', hp: 5, damage: 2, speed: 2, color: '#4a4a6a', exp: 15 },
  skeleton: {
    name: 'Skeleton',
    hp: 8,
    damage: 3,
    speed: 1,
    color: '#d0d0d0',
    exp: 20,
  },
  orc: {
    name: 'Orc',
    hp: 15,
    damage: 5,
    speed: 0.5,
    color: '#39ff14',
    exp: 35,
  },
  ghost: {
    name: 'Ghost',
    hp: 10,
    damage: 4,
    speed: 1,
    color: '#a0a0ff',
    exp: 30,
    phasing: true,
  },
  boss: {
    name: 'Boss',
    hp: 50,
    damage: 8,
    speed: 0.5,
    color: '#ff2a6d',
    exp: 500,
    isBoss: true,
  },
}

const ITEMS = {
  healthPotion: {
    name: 'Health Potion',
    color: '#ff2a6d',
    effect: 'heal',
    value: 10,
  },
  sword: { name: 'Sword', color: '#a0a0a0', effect: 'attack', value: 2 },
  shield: { name: 'Shield', color: '#4d79ff', effect: 'defense', value: 1 },
  key: { name: 'Key', color: '#f9f871', effect: 'key', value: 1 },
}

export class Roguelike extends Game {
  static get config() {
    return {
      id: 'roguelike',
      title: 'Dungeon',
      description: 'Explore procedural dungeons!',
      thumbnail: '/assets/sprites/roguelike-thumb.png',
      startLives: 1,
      highScoreType: 'highest',
      controls: {
        movement: 'Arrow keys or WASD',
        action1: 'Attack/Interact',
        action2: 'Use item',
        pause: 'Escape',
      },
    }
  }

  async init() {
    await super.init()

    // Grid settings
    this.mapWidth = 40
    this.mapHeight = 30
    this.tileSize = 20

    // Viewport
    this.viewWidth = Math.floor(this.canvas.width / this.tileSize)
    this.viewHeight = Math.floor(this.canvas.height / this.tileSize)

    // Player stats
    this.player = {
      x: 0,
      y: 0,
      hp: 20,
      maxHp: 20,
      attack: 3,
      defense: 0,
      keys: 0,
      inventory: [],
    }

    // Game state
    this.map = []
    this.rooms = []
    this.enemies = []
    this.items = []
    this.floor = 1
    this.maxFloors = 5
    this.visible = []
    this.explored = []
    this.viewRadius = 8

    // Turn-based
    this.playerTurn = true
    this.turnDelay = 150
    this.turnTimer = 0

    // Messages
    this.messages = []

    // Weapon stats
    this.weapons = ['Fists', 'Sword', 'Greatsword']
    this.currentWeapon = 0

    this.generateFloor()
  }

  generateFloor() {
    // Initialize map
    this.map = Array(this.mapHeight)
      .fill(null)
      .map(() => Array(this.mapWidth).fill(TILES.WALL))
    this.visible = Array(this.mapHeight)
      .fill(null)
      .map(() => Array(this.mapWidth).fill(false))
    this.explored = Array(this.mapHeight)
      .fill(null)
      .map(() => Array(this.mapWidth).fill(false))
    this.rooms = []
    this.enemies = []
    this.items = []

    // Generate rooms
    this.generateRooms()

    // Connect rooms
    this.connectRooms()

    // Place player in first room
    const firstRoom = this.rooms[0]
    this.player.x = Math.floor(firstRoom.x + firstRoom.w / 2)
    this.player.y = Math.floor(firstRoom.y + firstRoom.h / 2)

    // Place stairs in last room
    const lastRoom = this.rooms[this.rooms.length - 1]
    const stairsX = Math.floor(lastRoom.x + lastRoom.w / 2)
    const stairsY = Math.floor(lastRoom.y + lastRoom.h / 2)
    this.map[stairsY][stairsX] = TILES.STAIRS

    // Spawn enemies
    this.spawnEnemies()

    // Spawn items
    this.spawnItems()

    // Update visibility
    this.updateVisibility()

    this.addMessage(`Floor ${this.floor}`)
  }

  generateRooms() {
    const numRooms = 5 + Math.floor(Math.random() * 4)

    for (let i = 0; i < numRooms; i++) {
      const w = 5 + Math.floor(Math.random() * 6)
      const h = 4 + Math.floor(Math.random() * 5)
      const x = 1 + Math.floor(Math.random() * (this.mapWidth - w - 2))
      const y = 1 + Math.floor(Math.random() * (this.mapHeight - h - 2))

      // Check overlap
      let overlaps = false
      for (const room of this.rooms) {
        if (
          x < room.x + room.w + 2 &&
          x + w + 2 > room.x &&
          y < room.y + room.h + 2 &&
          y + h + 2 > room.y
        ) {
          overlaps = true
          break
        }
      }

      if (!overlaps) {
        // Carve room
        for (let ry = y; ry < y + h; ry++) {
          for (let rx = x; rx < x + w; rx++) {
            this.map[ry][rx] = TILES.FLOOR
          }
        }
        this.rooms.push({ x, y, w, h })
      }
    }
  }

  connectRooms() {
    for (let i = 1; i < this.rooms.length; i++) {
      const roomA = this.rooms[i - 1]
      const roomB = this.rooms[i]

      const ax = Math.floor(roomA.x + roomA.w / 2)
      const ay = Math.floor(roomA.y + roomA.h / 2)
      const bx = Math.floor(roomB.x + roomB.w / 2)
      const by = Math.floor(roomB.y + roomB.h / 2)

      // L-shaped corridor
      if (Math.random() > 0.5) {
        this.carveHorizontal(ax, bx, ay)
        this.carveVertical(ay, by, bx)
      } else {
        this.carveVertical(ay, by, ax)
        this.carveHorizontal(ax, bx, by)
      }
    }
  }

  carveHorizontal(x1, x2, y) {
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
      if (y > 0 && y < this.mapHeight - 1) {
        this.map[y][x] = TILES.FLOOR
      }
    }
  }

  carveVertical(y1, y2, x) {
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
      if (x > 0 && x < this.mapWidth - 1) {
        this.map[y][x] = TILES.FLOOR
      }
    }
  }

  spawnEnemies() {
    const numEnemies = 3 + this.floor * 2

    for (let i = 0; i < numEnemies; i++) {
      // Pick random room (not first if possible)
      const roomIndex =
        this.rooms.length > 1 ? 1 + Math.floor(Math.random() * (this.rooms.length - 1)) : 0
      const room = this.rooms[roomIndex]

      const x = room.x + 1 + Math.floor(Math.random() * (room.w - 2))
      const y = room.y + 1 + Math.floor(Math.random() * (room.h - 2))

      // Pick enemy type based on floor
      let type
      if (this.floor === this.maxFloors && i === 0) {
        type = 'boss'
      } else {
        const types = ['rat', 'bat', 'skeleton']
        if (this.floor >= 3) types.push('orc')
        if (this.floor >= 4) types.push('ghost')
        type = types[Math.floor(Math.random() * types.length)]
      }

      const template = ENEMY_TYPES[type]
      this.enemies.push({
        x,
        y,
        type,
        hp: template.hp,
        maxHp: template.hp,
        damage: template.damage,
        speed: template.speed,
        color: template.color,
        exp: template.exp,
        phasing: template.phasing || false,
        isBoss: template.isBoss || false,
        moveTimer: 0,
      })
    }
  }

  spawnItems() {
    const numItems = 2 + Math.floor(Math.random() * 3)

    for (let i = 0; i < numItems; i++) {
      const roomIndex = Math.floor(Math.random() * this.rooms.length)
      const room = this.rooms[roomIndex]

      const x = room.x + 1 + Math.floor(Math.random() * (room.w - 2))
      const y = room.y + 1 + Math.floor(Math.random() * (room.h - 2))

      // Don't place on player
      if (x === this.player.x && y === this.player.y) continue

      const types = ['healthPotion', 'healthPotion', 'sword', 'shield', 'key']
      const type = types[Math.floor(Math.random() * types.length)]
      const template = ITEMS[type]

      this.items.push({
        x,
        y,
        type,
        ...template,
      })
    }
  }

  updateVisibility() {
    // Clear visibility
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        this.visible[y][x] = false
      }
    }

    // Shadowcast FOV
    this.castLight(this.player.x, this.player.y, this.viewRadius)
  }

  castLight(cx, cy, radius) {
    for (let angle = 0; angle < 360; angle += 1) {
      const rad = (angle * Math.PI) / 180
      const dx = Math.cos(rad)
      const dy = Math.sin(rad)

      let x = cx + 0.5
      let y = cy + 0.5

      for (let i = 0; i < radius; i++) {
        const ix = Math.floor(x)
        const iy = Math.floor(y)

        if (ix < 0 || ix >= this.mapWidth || iy < 0 || iy >= this.mapHeight) break

        this.visible[iy][ix] = true
        this.explored[iy][ix] = true

        if (this.map[iy][ix] === TILES.WALL) break

        x += dx
        y += dy
      }
    }
  }

  update(deltaTime) {
    // Turn timer
    this.turnTimer -= deltaTime
    if (this.turnTimer > 0) return

    if (this.playerTurn) {
      if (this.handleInput()) {
        this.playerTurn = false
        this.turnTimer = this.turnDelay
        this.updateVisibility()
      }
    } else {
      this.updateEnemies()
      this.playerTurn = true
      this.turnTimer = 50
    }

    // Check player death
    if (this.player.hp <= 0) {
      this.addMessage('You died!')
      this.gameOver()
    }
  }

  handleInput() {
    let dx = 0,
      dy = 0

    if (this.input.isJustPressed('up')) dy = -1
    else if (this.input.isJustPressed('down')) dy = 1
    else if (this.input.isJustPressed('left')) dx = -1
    else if (this.input.isJustPressed('right')) dx = 1

    if (dx === 0 && dy === 0) return false

    const newX = this.player.x + dx
    const newY = this.player.y + dy

    // Check enemy collision (attack)
    const enemy = this.enemies.find((e) => e.x === newX && e.y === newY)
    if (enemy) {
      this.attackEnemy(enemy)
      return true
    }

    // Check wall collision
    if (!this.canWalk(newX, newY)) return false

    // Move player
    this.player.x = newX
    this.player.y = newY

    // Check items
    this.pickupItems()

    // Check stairs
    if (this.map[newY][newX] === TILES.STAIRS) {
      this.descend()
    }

    return true
  }

  canWalk(x, y) {
    if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) return false
    const tile = this.map[y][x]
    return tile !== TILES.WALL
  }

  attackEnemy(enemy) {
    const damage = this.player.attack
    enemy.hp -= damage
    this.addMessage(`You hit ${ENEMY_TYPES[enemy.type].name} for ${damage}!`)
    this.audio.play('hit')

    if (enemy.hp <= 0) {
      this.addMessage(`${ENEMY_TYPES[enemy.type].name} defeated!`)
      this.enemies = this.enemies.filter((e) => e !== enemy)
      this.addScore(enemy.exp)
      this.audio.play('explosion')

      if (enemy.isBoss) {
        this.addMessage('VICTORY! Boss defeated!')
        this.addScore(500)
        this.gameOver()
      }
    }
  }

  updateEnemies() {
    for (const enemy of this.enemies) {
      // Simple chase AI
      const dx = this.player.x - enemy.x
      const dy = this.player.y - enemy.y
      const dist = Math.abs(dx) + Math.abs(dy)

      // Attack if adjacent
      if (dist === 1) {
        const damage = Math.max(1, enemy.damage - this.player.defense)
        this.player.hp -= damage
        this.addMessage(`${ENEMY_TYPES[enemy.type].name} hits you for ${damage}!`)
        this.audio.play('hit')
        continue
      }

      // Move toward player (only if visible)
      if (!this.visible[enemy.y][enemy.x]) continue

      let moveX = 0,
        moveY = 0
      if (Math.abs(dx) > Math.abs(dy)) {
        moveX = dx > 0 ? 1 : -1
      } else {
        moveY = dy > 0 ? 1 : -1
      }

      const newX = enemy.x + moveX
      const newY = enemy.y + moveY

      // Check if can move
      const canMove =
        enemy.phasing ||
        (this.canWalk(newX, newY) && !this.enemies.some((e) => e.x === newX && e.y === newY))

      if (canMove && !(newX === this.player.x && newY === this.player.y)) {
        enemy.x = newX
        enemy.y = newY
      }
    }
  }

  pickupItems() {
    const itemsHere = this.items.filter((i) => i.x === this.player.x && i.y === this.player.y)

    for (const item of itemsHere) {
      this.items = this.items.filter((i) => i !== item)
      this.addScore(100)
      this.audio.play('powerup')

      switch (item.effect) {
        case 'heal':
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + item.value)
          this.addMessage(`Used ${item.name}! HP restored!`)
          break
        case 'attack':
          this.player.attack += item.value
          this.addMessage(`Found ${item.name}! Attack +${item.value}!`)
          break
        case 'defense':
          this.player.defense += item.value
          this.addMessage(`Found ${item.name}! Defense +${item.value}!`)
          break
        case 'key':
          this.player.keys += item.value
          this.addMessage(`Found ${item.name}!`)
          break
      }
    }
  }

  descend() {
    if (this.floor >= this.maxFloors) {
      this.addMessage('No more floors!')
      return
    }

    this.floor++
    this.addScore(50)
    this.addMessage('Descending to next floor...')
    this.generateFloor()
  }

  addMessage(text) {
    this.messages.unshift(text)
    if (this.messages.length > 5) {
      this.messages.pop()
    }
  }

  render(ctx) {
    this.clear('#0a0a0f')

    // Calculate viewport
    const viewX = Math.max(
      0,
      Math.min(this.mapWidth - this.viewWidth, this.player.x - Math.floor(this.viewWidth / 2))
    )
    const viewY = Math.max(
      0,
      Math.min(this.mapHeight - this.viewHeight, this.player.y - Math.floor(this.viewHeight / 2))
    )

    // Draw map
    for (let y = 0; y < this.viewHeight; y++) {
      for (let x = 0; x < this.viewWidth; x++) {
        const mapX = viewX + x
        const mapY = viewY + y

        if (mapX >= this.mapWidth || mapY >= this.mapHeight) continue

        const screenX = x * this.tileSize
        const screenY = y * this.tileSize

        if (this.visible[mapY][mapX]) {
          // Visible
          const tile = this.map[mapY][mapX]
          if (tile === TILES.WALL) {
            ctx.fillStyle = '#4a4a6a'
          } else if (tile === TILES.STAIRS) {
            ctx.fillStyle = '#f9f871'
          } else {
            ctx.fillStyle = '#2a2a3e'
          }
          ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize)
        } else if (this.explored[mapY][mapX]) {
          // Explored but not visible
          ctx.fillStyle = '#1a1a2e'
          ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize)
        }
      }
    }

    // Draw items
    for (const item of this.items) {
      if (!this.visible[item.y][item.x]) continue
      const screenX = (item.x - viewX) * this.tileSize + this.tileSize / 2
      const screenY = (item.y - viewY) * this.tileSize + this.tileSize / 2
      ctx.fillStyle = item.color
      ctx.beginPath()
      ctx.arc(screenX, screenY, 5, 0, Math.PI * 2)
      ctx.fill()
    }

    // Draw enemies
    for (const enemy of this.enemies) {
      if (!this.visible[enemy.y][enemy.x]) continue
      const screenX = (enemy.x - viewX) * this.tileSize
      const screenY = (enemy.y - viewY) * this.tileSize
      ctx.fillStyle = enemy.color
      ctx.fillRect(screenX + 2, screenY + 2, this.tileSize - 4, this.tileSize - 4)

      // Health bar for bosses
      if (enemy.isBoss) {
        ctx.fillStyle = '#ff2a6d'
        const hpPercent = enemy.hp / enemy.maxHp
        ctx.fillRect(screenX, screenY - 5, this.tileSize * hpPercent, 3)
      }
    }

    // Draw player
    const playerScreenX = (this.player.x - viewX) * this.tileSize
    const playerScreenY = (this.player.y - viewY) * this.tileSize
    ctx.fillStyle = '#05d9e8'
    ctx.shadowColor = '#05d9e8'
    ctx.shadowBlur = 10
    ctx.fillRect(playerScreenX + 3, playerScreenY + 3, this.tileSize - 6, this.tileSize - 6)
    ctx.shadowBlur = 0

    // Draw HUD
    this.renderHUD(ctx)
  }

  renderHUD(ctx) {
    const hudY = this.canvas.height - 80

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.fillRect(0, hudY, this.canvas.width, 80)

    // Stats
    ctx.font = '12px monospace'
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'left'
    ctx.fillText(`HP: ${this.player.hp}/${this.player.maxHp}`, 10, hudY + 20)
    ctx.fillText(`ATK: ${this.player.attack}`, 10, hudY + 40)
    ctx.fillText(`DEF: ${this.player.defense}`, 10, hudY + 60)

    ctx.fillText(`Floor: ${this.floor}/${this.maxFloors}`, 200, hudY + 20)
    ctx.fillText(`Score: ${this.score}`, 200, hudY + 40)
    ctx.fillText(`Keys: ${this.player.keys}`, 200, hudY + 60)

    // Messages
    ctx.textAlign = 'left'
    ctx.font = '10px monospace'
    for (let i = 0; i < Math.min(3, this.messages.length); i++) {
      ctx.fillStyle = i === 0 ? '#f9f871' : '#7f8c8d'
      ctx.fillText(this.messages[i], 400, hudY + 20 + i * 20)
    }

    // Health bar
    const hpBarWidth = 150
    const hpPercent = this.player.hp / this.player.maxHp
    ctx.fillStyle = '#333'
    ctx.fillRect(10, hudY + 70, hpBarWidth, 5)
    ctx.fillStyle = hpPercent > 0.3 ? '#39ff14' : '#ff2a6d'
    ctx.fillRect(10, hudY + 70, hpBarWidth * hpPercent, 5)
  }
}
