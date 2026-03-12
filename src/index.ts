import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { Hooks, Plugin } from '@opencode-ai/plugin'

const NOOP_MODULE = 'export const Disabled = async () => ({})'

const CONFIG_FILES = ['.opencode/disabler.jsonc', '.opencode/disabler.json']

function stripJsonComments(text: string): string {
  let result = ''
  let i = 0
  let inString = false

  while (i < text.length) {
    if (inString) {
      if (text[i] === '\\') {
        result += text[i] + (text[i + 1] ?? '')
        i += 2
      } else if (text[i] === '"') {
        result += '"'
        inString = false
        i++
      } else {
        result += text[i]
        i++
      }
    } else if (text[i] === '"') {
      result += '"'
      inString = true
      i++
    } else if (text[i] === '/' && text[i + 1] === '/') {
      i += 2
      while (i < text.length && text[i] !== '\n') i++
    } else if (text[i] === '/' && text[i + 1] === '*') {
      i += 2
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++
      i += 2
    } else {
      result += text[i]
      i++
    }
  }

  return result.replace(/,(\s*[}\]])/g, '$1')
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((n): n is string => typeof n === 'string')
}

interface DisablerConfig {
  plugins: string[]
  skills: string[]
}

function readConfig(directory: string): DisablerConfig {
  for (const file of CONFIG_FILES) {
    const fullPath = join(directory, file)
    if (!existsSync(fullPath)) continue
    try {
      const raw = readFileSync(fullPath, 'utf-8')
      const config = JSON.parse(stripJsonComments(raw))
      const plugins = readStringArray(config.plugins)
      const skills = readStringArray(config.skills)
      if (plugins.length > 0 || skills.length > 0) {
        return { plugins, skills }
      }
    } catch {
      continue
    }
  }
  return { plugins: [], skills: [] }
}

function registerPluginInterceptor(names: string[]) {
  const escaped = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const filter = new RegExp(`[/\\\\](${escaped.join('|')})([/\\\\]|\\.)`)

  Bun.plugin({
    name: 'opencode-disabler',
    setup(build) {
      build.onLoad({ filter, namespace: 'file' }, () => ({
        contents: NOOP_MODULE,
        loader: 'js',
      }))
    },
  })
}

function createSkillBlocker(names: string[]): Hooks['tool.execute.before'] {
  const disabled = new Set(names)

  return async (input, output) => {
    if (input.tool !== 'skill') return
    const name = output.args?.name as string | undefined
    if (name && disabled.has(name)) {
      throw new Error(`Skill "${name}" is disabled in this project`)
    }
  }
}

export const Disabler: Plugin = async ({ directory }) => {
  const config = readConfig(directory)
  if (config.plugins.length === 0 && config.skills.length === 0) return {}

  if (config.plugins.length > 0) {
    registerPluginInterceptor(config.plugins)
  }

  const hooks: Hooks = {}

  if (config.skills.length > 0) {
    hooks['tool.execute.before'] = createSkillBlocker(config.skills)
  }

  return hooks
}
