import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import { FOOTER_INSTRUCTION, KEYS, parseFooter, stripFooter } from './footer'

const footer = atom({ plugin: 'what-what-what', key: 'footer' } as const, null)

/** The system prompt section that asks for the footer; the id other hooks find it by. */
const INSTRUCTION_SECTION = {
  id: 'what-what-what:footer',
  text: FOOTER_INSTRUCTION,
  scope: 'session',
} as const

export const register: Register = on => {
  // Without this the band depends on each session being told separately to
  // write the three lines. Only where a band can be drawn: a session with no
  // surface (`claude -p`, the SDK) has none, and a teammate's reply goes to its
  // lead, so neither is asked to end its output with lines nobody would see.
  on('prompt.compose', async ($, e, next) => {
    const composed = await next(e)

    if (e.surfaces.length === 0 || e.traits.includes('teammate')) {
      return composed
    }

    return { sections: [...composed.sections, INSTRUCTION_SECTION] }
  })

  // Claude ends each message with the three lines; the band keeps the latest
  // ones in view while the transcript scrolls on.
  on('turn.complete', async ($, e, next) => {
    // a subagent's turn is not Claude talking to the person
    const parsed = e.agentId ? null : parseFooter(e.answer)

    if (parsed) {
      await update($, footer, () => parsed)
    }

    return next(e)
  })

  // The band carries the three lines, so the transcript draws the reply
  // without them. The stored message keeps them (ctrl+o).
  on('ui.render', { component: 'AssistantMessage' }, ($, e, next) =>
    next({ ...e, props: { ...e.props, text: stripFooter(e.props.text) } }),
  )

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const lines = await read($, footer)

    if (lines === null || e.props.hasSurvey) {
      return next(e)
    }

    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="column">
        <Text>
          <Text bold color="claude">{KEYS.doing}:</Text> {lines.doing}
        </Text>
        <Text>
          <Text bold color="suggestion">{KEYS.goal}:</Text> {lines.goal}
        </Text>
        <Text>
          <Text bold color="warning">{KEYS.needed}:</Text> {lines.needed}
        </Text>
      </Box>
    )
  })
}
