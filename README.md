# opencode-disabler

Disable globally-installed OpenCode plugins and skills on a per-project basis.

## Install

Add to your global config (`~/.config/opencode/opencode.jsonc`):

```jsonc
{
  "plugin": [
    "opencode-disabler@1.0.0",
    "oh-my-opencode@3.11.2",
    "vibe-haptic@1.1.0"
  ]
}
```

> **Important**: `opencode-disabler` must be listed **before** the plugins you want to disable.

## Usage

Create a disabler config in your project:

```jsonc
// .opencode/disabler.jsonc
{
  "plugins": ["oh-my-opencode", "vibe-haptic"],
  "skills": ["some-skill"]
}
```

Restart OpenCode. The listed plugins and skills are disabled immediately.

The config is read from the first file found in this order:

1. `.opencode/disabler.jsonc`
2. `.opencode/disabler.json`

## How it works

**Plugins** — OpenCode loads plugins sequentially. This plugin loads first and registers a [Bun runtime plugin](https://bun.sh/docs/runtime/plugins) that intercepts `import()` calls for disabled plugins at the module-resolution level. Bun returns a noop module instead of the real code. The plugin never executes.

**Skills** — Disabled skills are blocked via the `tool.execute.before` hook. When the agent tries to invoke a disabled skill, the tool call is rejected with an error.

## License

MIT
