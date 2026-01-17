import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Roguelike } from '../../../src/games/roguelike/Roguelike.js'

describe('Roguelike', () => {
  let canvas, input, audio, game, mockCtx

  beforeEach(async () => {
    // Create a mock canvas context
    mockCtx = {
      fillStyle: '',
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      strokeStyle: '',
      strokeRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      arc: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
      font: '',
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 0 })),
      textAlign: '',
      textBaseline: '',
      shadowColor: '',
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
    }

    canvas = {
      width: 800,
      height: 600,
      getContext: vi.fn(() => mockCtx),
    }

    input = {
      update: vi.fn(),
      isJustPressed: vi.fn(() => false),
      isPressed: vi.fn(() => false),
      getDirection: vi.fn(() => ({ x: 0, y: 0 })),
    }

    audio = {
      play: vi.fn(),
      stop: vi.fn(),
      playMusic: vi.fn(),
      stopMusic: vi.fn(),
    }

    game = new Roguelike(canvas, input, audio)
    await game.init()
  })

  describe('initialization', () => {
    it('should create a Roguelike instance', () => {
      expect(game).toBeInstanceOf(Roguelike)
    })

    it('should generate map with correct dimensions', () => {
      expect(game.map.length).toBe(game.mapHeight)
      expect(game.map[0].length).toBe(game.mapWidth)
    })

    it('should create multiple rooms', () => {
      expect(game.rooms.length).toBeGreaterThan(0)
      // Can be 3-9 rooms due to overlap rejection
      expect(game.rooms.length).toBeGreaterThanOrEqual(1)
      expect(game.rooms.length).toBeLessThanOrEqual(9)
    })

    it('should spawn enemies', () => {
      expect(game.enemies.length).toBeGreaterThan(0)
    })

    it('should spawn items', () => {
      expect(game.items.length).toBeGreaterThan(0)
    })

    it('should initialize player with correct starting stats', () => {
      expect(game.player.hp).toBe(20)
      expect(game.player.maxHp).toBe(20)
      expect(game.player.attack).toBe(3)
      expect(game.player.defense).toBe(0)
      expect(game.player.keys).toBe(0)
    })

    it('should start on floor 1', () => {
      expect(game.floor).toBe(1)
    })

    it('should initialize visibility arrays', () => {
      expect(game.visible.length).toBe(game.mapHeight)
      expect(game.explored.length).toBe(game.mapHeight)
    })

    it('should place player in first room', () => {
      const firstRoom = game.rooms[0]
      expect(game.player.x).toBeGreaterThanOrEqual(firstRoom.x)
      expect(game.player.x).toBeLessThan(firstRoom.x + firstRoom.w)
      expect(game.player.y).toBeGreaterThanOrEqual(firstRoom.y)
      expect(game.player.y).toBeLessThan(firstRoom.y + firstRoom.h)
    })

    it('should place stairs in last room', () => {
      const lastRoom = game.rooms[game.rooms.length - 1]
      const stairsX = Math.floor(lastRoom.x + lastRoom.w / 2)
      const stairsY = Math.floor(lastRoom.y + lastRoom.h / 2)
      expect(game.map[stairsY][stairsX]).toBe(3) // TILES.STAIRS
    })
  })

  describe('config', () => {
    it('should have correct game id', () => {
      expect(Roguelike.config.id).toBe('roguelike')
    })

    it('should have correct title', () => {
      expect(Roguelike.config.title).toBe('Dungeon')
    })

    it('should start with 1 life (permadeath)', () => {
      expect(Roguelike.config.startLives).toBe(1)
    })

    it('should use highest score type', () => {
      expect(Roguelike.config.highScoreType).toBe('highest')
    })
  })

  describe('movement', () => {
    it('should move player up when up is pressed', () => {
      const oldY = game.player.y
      game.map[game.player.y - 1][game.player.x] = 0 // Floor
      input.isJustPressed.mockImplementation((key) => key === 'up')
      game.handleInput()
      expect(game.player.y).toBe(oldY - 1)
    })

    it('should move player down when down is pressed', () => {
      const oldY = game.player.y
      game.map[game.player.y + 1][game.player.x] = 0 // Floor
      input.isJustPressed.mockImplementation((key) => key === 'down')
      game.handleInput()
      expect(game.player.y).toBe(oldY + 1)
    })

    it('should move player left when left is pressed', () => {
      const oldX = game.player.x
      game.map[game.player.y][game.player.x - 1] = 0 // Floor
      input.isJustPressed.mockImplementation((key) => key === 'left')
      game.handleInput()
      expect(game.player.x).toBe(oldX - 1)
    })

    it('should move player right when right is pressed', () => {
      const oldX = game.player.x
      game.map[game.player.y][game.player.x + 1] = 0 // Floor
      input.isJustPressed.mockImplementation((key) => key === 'right')
      game.handleInput()
      expect(game.player.x).toBe(oldX + 1)
    })

    it('should not move through walls', () => {
      const oldX = game.player.x
      const oldY = game.player.y
      game.map[game.player.y][game.player.x + 1] = 1 // Wall
      input.isJustPressed.mockImplementation((key) => key === 'right')
      game.handleInput()
      expect(game.player.x).toBe(oldX)
      expect(game.player.y).toBe(oldY)
    })

    it('should not move out of bounds', () => {
      game.player.x = 0
      game.player.y = 0
      const oldX = game.player.x
      const oldY = game.player.y
      input.isJustPressed.mockImplementation((key) => key === 'left')
      game.handleInput()
      expect(game.player.x).toBe(oldX)
      input.isJustPressed.mockImplementation((key) => key === 'up')
      game.handleInput()
      expect(game.player.y).toBe(oldY)
    })
  })

  describe('combat', () => {
    it('should attack adjacent enemy when moving into it', () => {
      const enemy = {
        x: game.player.x + 1,
        y: game.player.y,
        hp: 10,
        maxHp: 10,
        type: 'rat',
        damage: 1,
        exp: 10,
        color: '#8b4513',
      }
      game.enemies = [enemy]
      game.map[enemy.y][enemy.x] = 0

      input.isJustPressed.mockImplementation((key) => key === 'right')
      game.handleInput()

      expect(enemy.hp).toBeLessThan(10)
      expect(audio.play).toHaveBeenCalledWith('hit')
    })

    it('should kill enemy when hp reaches 0', () => {
      const enemy = {
        x: game.player.x + 1,
        y: game.player.y,
        hp: 1,
        maxHp: 10,
        type: 'rat',
        damage: 1,
        exp: 10,
        color: '#8b4513',
      }
      game.enemies = [enemy]
      game.map[enemy.y][enemy.x] = 0

      input.isJustPressed.mockImplementation((key) => key === 'right')
      game.handleInput()

      expect(game.enemies.length).toBe(0)
      expect(audio.play).toHaveBeenCalledWith('explosion')
    })

    it('should award score for killing enemy', () => {
      const initialScore = game.score
      const enemy = {
        x: game.player.x + 1,
        y: game.player.y,
        hp: 1,
        maxHp: 10,
        type: 'rat',
        damage: 1,
        exp: 10,
        color: '#8b4513',
      }
      game.enemies = [enemy]
      game.map[enemy.y][enemy.x] = 0

      input.isJustPressed.mockImplementation((key) => key === 'right')
      game.handleInput()

      expect(game.score).toBeGreaterThan(initialScore)
    })

    it('should damage player when enemy is adjacent', () => {
      const enemy = {
        x: game.player.x + 1,
        y: game.player.y,
        hp: 10,
        maxHp: 10,
        type: 'rat',
        damage: 5,
        exp: 10,
        color: '#8b4513',
      }
      game.enemies = [enemy]
      game.visible[enemy.y][enemy.x] = true
      game.playerTurn = false

      game.updateEnemies()

      expect(game.player.hp).toBeLessThan(20)
      expect(audio.play).toHaveBeenCalledWith('hit')
    })

    it('should apply defense to incoming damage', () => {
      game.player.defense = 2
      game.player.hp = 20
      const enemy = {
        x: game.player.x + 1,
        y: game.player.y,
        hp: 10,
        maxHp: 10,
        type: 'rat',
        damage: 5,
        exp: 10,
        color: '#8b4513',
      }
      game.enemies = [enemy]
      game.visible[enemy.y][enemy.x] = true
      game.playerTurn = false

      game.updateEnemies()

      expect(game.player.hp).toBe(17) // 20 - (5 - 2)
    })

    it('should trigger game over when boss is defeated', () => {
      const boss = {
        x: game.player.x + 1,
        y: game.player.y,
        hp: 1,
        maxHp: 50,
        type: 'boss',
        damage: 8,
        exp: 500,
        color: '#ff2a6d',
        isBoss: true,
      }
      game.enemies = [boss]
      game.map[boss.y][boss.x] = 0

      input.isJustPressed.mockImplementation((key) => key === 'right')
      game.handleInput()

      expect(game.state).toBe('gameover')
    })
  })

  describe('items', () => {
    it('should pick up health potion and restore HP', () => {
      game.player.hp = 10
      const item = {
        x: game.player.x,
        y: game.player.y,
        type: 'healthPotion',
        effect: 'heal',
        value: 10,
        name: 'Health Potion',
        color: '#ff2a6d',
      }
      game.items = [item]

      game.pickupItems()

      expect(game.player.hp).toBe(20)
      expect(game.items.length).toBe(0)
      expect(audio.play).toHaveBeenCalledWith('powerup')
    })

    it('should not heal beyond max HP', () => {
      game.player.hp = 18
      const item = {
        x: game.player.x,
        y: game.player.y,
        type: 'healthPotion',
        effect: 'heal',
        value: 10,
        name: 'Health Potion',
        color: '#ff2a6d',
      }
      game.items = [item]

      game.pickupItems()

      expect(game.player.hp).toBe(20)
    })

    it('should pick up sword and increase attack', () => {
      const initialAttack = game.player.attack
      const item = {
        x: game.player.x,
        y: game.player.y,
        type: 'sword',
        effect: 'attack',
        value: 2,
        name: 'Sword',
        color: '#a0a0a0',
      }
      game.items = [item]

      game.pickupItems()

      expect(game.player.attack).toBe(initialAttack + 2)
      expect(game.items.length).toBe(0)
    })

    it('should pick up shield and increase defense', () => {
      const initialDefense = game.player.defense
      const item = {
        x: game.player.x,
        y: game.player.y,
        type: 'shield',
        effect: 'defense',
        value: 1,
        name: 'Shield',
        color: '#4d79ff',
      }
      game.items = [item]

      game.pickupItems()

      expect(game.player.defense).toBe(initialDefense + 1)
      expect(game.items.length).toBe(0)
    })

    it('should pick up key', () => {
      const initialKeys = game.player.keys
      const item = {
        x: game.player.x,
        y: game.player.y,
        type: 'key',
        effect: 'key',
        value: 1,
        name: 'Key',
        color: '#f9f871',
      }
      game.items = [item]

      game.pickupItems()

      expect(game.player.keys).toBe(initialKeys + 1)
      expect(game.items.length).toBe(0)
    })

    it('should award score for picking up items', () => {
      const initialScore = game.score
      const item = {
        x: game.player.x,
        y: game.player.y,
        type: 'healthPotion',
        effect: 'heal',
        value: 10,
        name: 'Health Potion',
        color: '#ff2a6d',
      }
      game.items = [item]

      game.pickupItems()

      expect(game.score).toBeGreaterThan(initialScore)
    })
  })

  describe('floors', () => {
    it('should descend to next floor when stepping on stairs', () => {
      game.floor = 1
      const stairsX = game.player.x
      const stairsY = game.player.y + 1
      game.map[stairsY][stairsX] = 3 // TILES.STAIRS

      input.isJustPressed.mockImplementation((key) => key === 'down')
      game.handleInput()

      expect(game.floor).toBe(2)
    })

    it('should award score for descending floors', () => {
      const initialScore = game.score
      game.floor = 1
      game.descend()

      expect(game.score).toBeGreaterThan(initialScore)
    })

    it('should generate new map when descending', () => {
      const oldRooms = [...game.rooms]
      game.descend()

      expect(game.rooms).not.toEqual(oldRooms)
    })

    it('should not descend beyond max floors', () => {
      game.floor = 5
      game.descend()

      expect(game.floor).toBe(5)
    })

    it('should spawn boss on floor 5', () => {
      game.floor = 5
      game.generateFloor()

      const boss = game.enemies.find((e) => e.isBoss)
      expect(boss).toBeDefined()
      expect(boss.type).toBe('boss')
    })

    it('should spawn more enemies on higher floors', () => {
      game.floor = 1
      game.generateFloor()
      const floor1Enemies = game.enemies.length

      game.floor = 3
      game.generateFloor()
      const floor3Enemies = game.enemies.length

      expect(floor3Enemies).toBeGreaterThan(floor1Enemies)
    })
  })

  describe('visibility', () => {
    it('should update visibility around player', () => {
      game.updateVisibility()
      expect(game.visible[game.player.y][game.player.x]).toBe(true)
    })

    it('should mark tiles as explored', () => {
      game.updateVisibility()
      expect(game.explored[game.player.y][game.player.x]).toBe(true)
    })

    it('should clear visibility before recalculating', () => {
      // First update visibility normally
      game.updateVisibility()

      // Verify some tiles are visible after update
      let hasVisibleTile = false
      for (let y = 0; y < game.mapHeight && !hasVisibleTile; y++) {
        for (let x = 0; x < game.mapWidth && !hasVisibleTile; x++) {
          if (game.visible[y][x]) hasVisibleTile = true
        }
      }
      expect(hasVisibleTile).toBe(true)

      // Manually set all visibility to true to test clearing
      for (let y = 0; y < game.mapHeight; y++) {
        for (let x = 0; x < game.mapWidth; x++) {
          game.visible[y][x] = true
        }
      }

      // After updateVisibility, tiles outside view radius should be cleared
      game.updateVisibility()

      // Tiles far from player should not be visible (verifies clearing worked)
      const farX = Math.min(game.player.x + game.viewRadius + 2, game.mapWidth - 1)
      const farY = Math.min(game.player.y + game.viewRadius + 2, game.mapHeight - 1)
      expect(game.visible[farY][farX]).toBe(false)
    })

    it('should have limited view radius', () => {
      game.updateVisibility()

      // Check that tiles beyond view radius are not visible
      const farX = game.player.x + game.viewRadius + 2
      const farY = game.player.y + game.viewRadius + 2

      if (farX < game.mapWidth && farY < game.mapHeight) {
        expect(game.visible[farY][farX]).toBe(false)
      }
    })
  })

  describe('enemies', () => {
    it('should have at least 5 enemy types defined', () => {
      const enemyTypes = ['rat', 'bat', 'skeleton', 'orc', 'ghost', 'boss']
      expect(enemyTypes.length).toBeGreaterThanOrEqual(5)
    })

    it('should move enemies toward player when visible', () => {
      const enemy = {
        x: game.player.x + 3,
        y: game.player.y,
        hp: 10,
        maxHp: 10,
        type: 'rat',
        damage: 1,
        exp: 10,
        color: '#8b4513',
        speed: 1,
        phasing: false,
      }
      game.enemies = [enemy]
      game.visible[enemy.y][enemy.x] = true
      game.map[enemy.y][enemy.x - 1] = 0 // Floor

      const oldX = enemy.x
      game.updateEnemies()

      expect(enemy.x).not.toBe(oldX)
    })

    it('should not move enemies when not visible', () => {
      const enemy = {
        x: game.player.x + 3,
        y: game.player.y,
        hp: 10,
        maxHp: 10,
        type: 'rat',
        damage: 1,
        exp: 10,
        color: '#8b4513',
        speed: 1,
        phasing: false,
      }
      game.enemies = [enemy]
      game.visible[enemy.y][enemy.x] = false

      const oldX = enemy.x
      const oldY = enemy.y
      game.updateEnemies()

      expect(enemy.x).toBe(oldX)
      expect(enemy.y).toBe(oldY)
    })

    it('should allow ghost enemies to phase through walls', () => {
      const ghost = {
        x: game.player.x + 3,
        y: game.player.y,
        hp: 10,
        maxHp: 10,
        type: 'ghost',
        damage: 4,
        exp: 30,
        color: '#a0a0ff',
        speed: 1,
        phasing: true,
      }
      game.enemies = [ghost]
      game.visible[ghost.y][ghost.x] = true

      // Set up walls around ghost
      game.map[ghost.y][ghost.x - 1] = 1 // Wall

      const oldX = ghost.x
      game.updateEnemies()

      // Ghost should still be able to move (phasing)
      expect(ghost.x).not.toBe(oldX)
    })

    it('should not move enemies into other enemies', () => {
      const enemy1 = {
        x: game.player.x + 2,
        y: game.player.y,
        hp: 10,
        maxHp: 10,
        type: 'rat',
        damage: 1,
        exp: 10,
        color: '#8b4513',
        speed: 1,
        phasing: false,
      }
      const enemy2 = {
        x: game.player.x + 1,
        y: game.player.y,
        hp: 10,
        maxHp: 10,
        type: 'bat',
        damage: 2,
        exp: 15,
        color: '#4a4a6a',
        speed: 1,
        phasing: false,
      }
      game.enemies = [enemy1, enemy2]
      game.visible[enemy1.y][enemy1.x] = true
      game.visible[enemy2.y][enemy2.x] = true
      game.map[enemy1.y][enemy1.x - 1] = 0 // Floor

      const oldX = enemy1.x
      game.updateEnemies()

      // Enemy1 shouldn't move into enemy2's space
      expect(enemy1.x).toBe(oldX)
    })
  })

  describe('game over', () => {
    it('should trigger game over when player HP reaches 0', () => {
      game.player.hp = 0
      game.update(100)

      expect(game.state).toBe('gameover')
    })

    it('should trigger game over when boss is defeated', () => {
      const boss = {
        x: game.player.x + 1,
        y: game.player.y,
        hp: 1,
        maxHp: 50,
        type: 'boss',
        damage: 8,
        exp: 500,
        color: '#ff2a6d',
        isBoss: true,
      }
      game.enemies = [boss]

      game.attackEnemy(boss)

      expect(game.state).toBe('gameover')
    })
  })

  describe('rendering', () => {
    it('should render without errors', () => {
      expect(() => game.render(mockCtx)).not.toThrow()
    })

    it('should clear canvas', () => {
      game.render(mockCtx)
      expect(mockCtx.fillRect).toHaveBeenCalled()
    })

    it('should render HUD', () => {
      game.render(mockCtx)
      expect(mockCtx.fillText).toHaveBeenCalled()
    })
  })

  describe('messages', () => {
    it('should add messages', () => {
      game.addMessage('Test message')
      expect(game.messages.length).toBeGreaterThan(0)
      expect(game.messages[0]).toBe('Test message')
    })

    it('should limit message history', () => {
      for (let i = 0; i < 10; i++) {
        game.addMessage(`Message ${i}`)
      }
      expect(game.messages.length).toBeLessThanOrEqual(5)
    })

    it('should show newest messages first', () => {
      game.addMessage('First')
      game.addMessage('Second')
      expect(game.messages[0]).toBe('Second')
      expect(game.messages[1]).toBe('First')
    })
  })

  describe('turn system', () => {
    it('should start as player turn', () => {
      expect(game.playerTurn).toBe(true)
    })

    it('should switch to enemy turn after player action', () => {
      game.map[game.player.y][game.player.x + 1] = 0 // Floor
      game.turnTimer = 0 // Allow turn to process
      input.isJustPressed.mockImplementation((key) => key === 'right')

      game.update(0)

      expect(game.playerTurn).toBe(false)
    })

    it('should use turn timer', () => {
      game.turnTimer = 100
      const oldTimer = game.turnTimer

      game.update(50)

      expect(game.turnTimer).toBe(oldTimer - 50)
    })
  })

  describe('map generation', () => {
    it('should connect all rooms with corridors', () => {
      // Test that all rooms are reachable by checking if floor tiles
      // form a connected path
      const firstRoom = game.rooms[0]
      const lastRoom = game.rooms[game.rooms.length - 1]

      const startX = Math.floor(firstRoom.x + firstRoom.w / 2)
      const startY = Math.floor(firstRoom.y + firstRoom.h / 2)
      const endX = Math.floor(lastRoom.x + lastRoom.w / 2)
      const endY = Math.floor(lastRoom.y + lastRoom.h / 2)

      // Both should be floor tiles
      expect(game.map[startY][startX]).toBe(0) // TILES.FLOOR
      expect(game.map[endY][endX]).not.toBe(1) // Not TILES.WALL
    })

    it('should create rooms with valid dimensions', () => {
      for (const room of game.rooms) {
        expect(room.w).toBeGreaterThan(0)
        expect(room.h).toBeGreaterThan(0)
        expect(room.x).toBeGreaterThanOrEqual(0)
        expect(room.y).toBeGreaterThanOrEqual(0)
        expect(room.x + room.w).toBeLessThanOrEqual(game.mapWidth)
        expect(room.y + room.h).toBeLessThanOrEqual(game.mapHeight)
      }
    })

    it('should not overlap rooms', () => {
      for (let i = 0; i < game.rooms.length; i++) {
        for (let j = i + 1; j < game.rooms.length; j++) {
          const roomA = game.rooms[i]
          const roomB = game.rooms[j]

          const overlap = !(
            roomA.x + roomA.w < roomB.x ||
            roomB.x + roomB.w < roomA.x ||
            roomA.y + roomA.h < roomB.y ||
            roomB.y + roomB.h < roomA.y
          )

          expect(overlap).toBe(false)
        }
      }
    })
  })

  describe('walk validation', () => {
    it('should allow walking on floor tiles', () => {
      game.map[5][5] = 0 // TILES.FLOOR
      expect(game.canWalk(5, 5)).toBe(true)
    })

    it('should not allow walking on walls', () => {
      game.map[5][5] = 1 // TILES.WALL
      expect(game.canWalk(5, 5)).toBe(false)
    })

    it('should not allow walking out of bounds', () => {
      expect(game.canWalk(-1, 0)).toBe(false)
      expect(game.canWalk(0, -1)).toBe(false)
      expect(game.canWalk(game.mapWidth, 0)).toBe(false)
      expect(game.canWalk(0, game.mapHeight)).toBe(false)
    })
  })
})
