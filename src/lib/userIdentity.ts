// Random user identity for multiplayer - no auth required

const ANIMALS = [
  'Fox', 'Owl', 'Bear', 'Wolf', 'Deer', 'Hawk', 'Lynx', 'Puma',
  'Raven', 'Otter', 'Heron', 'Crane', 'Finch', 'Robin', 'Swan',
  'Koala', 'Panda', 'Tiger', 'Eagle', 'Falcon', 'Badger', 'Moose',
  'Bison', 'Cobra', 'Viper', 'Gecko', 'Newt', 'Wren', 'Dove', 'Lark',
]

const ADJECTIVES = [
  'Swift', 'Bold', 'Calm', 'Keen', 'Wise', 'Warm', 'Cool', 'Bright',
  'Quick', 'Sleek', 'Noble', 'Vivid', 'Nimble', 'Gentle', 'Clever',
  'Steady', 'Silent', 'Agile', 'Fierce', 'Mellow', 'Witty', 'Daring',
]

const COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
  '#1abc9c', '#e67e22', '#e84393', '#00b894', '#6c5ce7',
  '#fd79a8', '#00cec9', '#fab1a0', '#a29bfe', '#ffeaa7',
  '#dfe6e9', '#636e72', '#2d3436', '#74b9ff', '#55efc4',
]

export interface UserIdentity {
  name: string
  color: string
  id: string
}

const STORAGE_KEY = 'vigma-user-identity'

function generateId(): string {
  return Math.random().toString(36).substring(2, 10)
}

function generateName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
  return `${adj} ${animal}`
}

function generateColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)]
}

export function getUserIdentity(): UserIdentity {
  if (typeof window === 'undefined') {
    return { name: generateName(), color: generateColor(), id: generateId() }
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.name && parsed.color && parsed.id) {
        return parsed
      }
    }
  } catch {
    // ignore
  }

  const identity: UserIdentity = {
    name: generateName(),
    color: generateColor(),
    id: generateId(),
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(identity))
  } catch {
    // ignore
  }

  return identity
}
