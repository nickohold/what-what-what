/** The three lines Claude ends each message with. */
export type Footer = { doing: string; goal: string; needed: string }

declare module 'claude-code' {
  interface PluginState {
    'what-what-what': { footer: Footer | null }
  }
}
