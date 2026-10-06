import type { Footer } from '../types'

/** The footer's three keys, as Claude writes them, in the order they are shown. */
export const KEYS = {
  doing: 'what am i doing right now',
  goal: 'for what higher goal',
  needed: 'what is needed from you',
} as const

/**
 * What tells Claude to write the footer, sent beside every prompt of a session
 * the mod draws in: the band shows only what Claude writes, so a session that
 * is never told shows nothing. The labels come from KEYS, the same ones
 * parseFooter matches, so what is asked for is what is read.
 */
export const FOOTER_INSTRUCTION = [
  'Standing instruction from the what-what-what mod, sent with every prompt and not written by the person. It applies to this reply even if your earlier replies in this conversation did not follow it.',
  'End every message you write to the person with these three lines, as the very last lines of the message, each on its own line:',
  '',
  `${KEYS.doing}: <the step in progress right now, or "nothing" when you are idle or waiting>`,
  `${KEYS.goal}: <the outcome the person is after; this line changes far less often than the first>`,
  `${KEYS.needed}: <the one thing you need from the person, or "nothing">`,
  '',
  'Write the three labels exactly as shown: lowercase, word for word, never shortened, reworded or capitalised. Fill each in with one short plain sentence. This applies to every message, a one-word answer included.',
  'A band above the prompt shows these lines to the person and the transcript hides them; it finds them by matching the labels literally, so a reworded label shows nothing.',
  'A subagent reporting to another agent, not to the person, leaves the three lines out.',
].join('\n')

/** The text after `key:` on the LAST line of `answer` that starts with it. */
function lineAfter(answer: string, key: string): string | null {
  for (const written of answer.split('\n').toReversed()) {
    // tolerate list markers and bold around the key: "- **what am i …:** text"
    const line = written.replace(/^[\s>*_-]+/, '')

    if (!line.toLowerCase().startsWith(key)) {
      continue
    }

    const colon = line.indexOf(':', key.length)

    if (colon === -1) {
      continue
    }

    const text = line.slice(colon + 1).replace(/^[\s*_]+|[\s*_]+$/g, '')

    if (text) {
      return text
    }
  }

  return null
}

/**
 * The footer at the end of an answer, or null when any of the three lines is
 * missing: a message without the full footer leaves the last one standing.
 */
export function parseFooter(answer: string): Footer | null {
  const doing = lineAfter(answer, KEYS.doing)
  const goal = lineAfter(answer, KEYS.goal)
  const needed = lineAfter(answer, KEYS.needed)

  return doing && goal && needed ? { doing, goal, needed } : null
}

/** True when `line` is one of the footer's three lines, markdown around the key tolerated. */
function isFooterLine(line: string): boolean {
  const bare = line.replace(/^[\s>*_-]+/, '').toLowerCase()

  return Object.values(KEYS).some(key => bare.startsWith(key))
}

/**
 * `text` without the footer that closes it: the band shows those lines, so the
 * transcript does not repeat them. Only the lines at the very end go; a footer
 * quoted mid-message stays, and a block that is nothing but footer is kept.
 */
export function stripFooter(text: string): string {
  const lines = text.split('\n')
  // one past the last line that is neither blank nor footer; 0 when there is none
  const end = lines.findLastIndex(line => line.trim() !== '' && !isFooterLine(line)) + 1

  const kept = lines.slice(0, end).join('\n')
  const hadFooter = lines.slice(end).some(isFooterLine)

  return hadFooter && kept.trim() ? kept : text
}
