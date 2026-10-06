import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import { FOOTER_INSTRUCTION, KEYS, parseFooter, stripFooter } from './footer'

const footer = atom({ plugin: 'what-what-what', key: 'footer' } as const, null)

export const register: Register = on => {
  // Without this the band depends on each session being told separately to
  // write the three lines. The instruction rides beside every prompt, unseen by
  // the person, and not in the system prompt: in a long conversation whose
  // earlier replies have no footer, Claude keeps to that pattern and passes over
  // a system prompt section (seen 2026-10-06 on a session that loaded the mod
  // mid-conversation), while an instruction next to the prompt is followed.
  // Only where a band can be drawn: a session with no surface (`claude -p`, the
  // SDK) is not asked to end its output with lines nobody would see.
  on('prompt.submit', async ($, e, next) => {
    const surfaces = await $.session.surfaces()

    if (surfaces.length === 0) {
      return next(e)
    }

    return next({ ...e, context: [...(e.context ?? []), FOOTER_INSTRUCTION] })
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
