import { expect, test } from 'claude-code/testing'

import { FOOTER_INSTRUCTION, KEYS, parseFooter, stripFooter } from './footer'

const FOOTER = [
  'what am i doing right now: waiting for the staging deploy of the search page to finish.',
  'for what higher goal: the new search page finished and checked on staging.',
  'what is needed from you: nothing yet.',
].join('\n')

test('the three lines at the end of a message are read', () => {
  expect(parseFooter(`The deploy is still running.\n\n${FOOTER}`)).toEqual({
    doing: 'waiting for the staging deploy of the search page to finish.',
    goal: 'the new search page finished and checked on staging.',
    needed: 'nothing yet.',
  })
})

test('a message without the full footer reads as none', () => {
  expect(parseFooter('Yes.')).toEqual(null)
  expect(parseFooter('what am i doing right now: reading logs.')).toEqual(null)
})

test('the footer at the end of a reply is not drawn', () => {
  expect(stripFooter(`The deploy is still running.\n\n${FOOTER}\n`)).toEqual('The deploy is still running.')
})

test('a reply without a footer, or one quoting it mid-message, is drawn as written', () => {
  expect(stripFooter('Yes.')).toEqual('Yes.')
  expect(stripFooter(`${FOOTER}\n\nThat is the footer.`)).toEqual(`${FOOTER}\n\nThat is the footer.`)
})

test('a block that is nothing but the footer is kept', () => {
  expect(stripFooter(FOOTER)).toEqual(FOOTER)
})

test('markdown around a key is tolerated, and the last footer wins', () => {
  const quoted = FOOTER.replace('nothing yet.', 'an old answer')
  const latest = [
    '- **what am i doing right now:** checking the served build.',
    '- **for what higher goal:** the search page checked on staging.',
    '- **what is needed from you:** a reload.',
  ].join('\n')

  expect(parseFooter(`${quoted}\n\n${latest}`)).toEqual({
    doing: 'checking the served build.',
    goal: 'the search page checked on staging.',
    needed: 'a reload.',
  })
})

/** The lines of the instruction that show the footer, filled in as Claude would fill them. */
function footerWrittenFrom(instruction: string): string {
  return instruction
    .split('\n')
    .filter(line => Object.values(KEYS).some(key => line.startsWith(`${key}:`)))
    .map(line => line.replace(/<.*>/, 'an answer.'))
    .join('\n')
}

test('a footer written the way the instruction shows it is read', () => {
  expect(parseFooter(`Done.\n\n${footerWrittenFrom(FOOTER_INSTRUCTION)}`)).toEqual({
    doing: 'an answer.',
    goal: 'an answer.',
    needed: 'an answer.',
  })
})

/** A prompt as the person typed it at the terminal, with nothing attached yet. */
const TYPED = { text: 'is the deploy done?', wait: false, origin: { kind: 'composer' } } as const

for (const surface of ['terminal', 'desktop'] as const) {
  test(`a session drawing on ${surface} gets the instruction beside the prompt, the prompt itself untouched`, async ($, on) => {
    on('prompt.submit', (_$, e) => ({ text: e.text, context: e.context }))
    on('session.surfaces', () => ({ value: [surface] }))

    expect(await $.prompt.submit(TYPED)).toEqual({ text: TYPED.text, context: [FOOTER_INSTRUCTION] })
  })
}

test('what another hook attached to the prompt is kept, the instruction after it', async ($, on) => {
  on('prompt.submit', (_$, e) => ({ text: e.text, context: e.context }))
  on('session.surfaces', () => ({ value: ['terminal'] as const }))

  expect(await $.prompt.submit({ ...TYPED, context: ['a note'] })).toEqual({
    text: TYPED.text,
    context: ['a note', FOOTER_INSTRUCTION],
  })
})

test('a session with nothing to draw on is not told', async ($, on) => {
  on('prompt.submit', (_$, e) => ({ text: e.text, context: e.context }))
  on('session.surfaces', () => ({ value: [] }))

  expect(await $.prompt.submit(TYPED)).toEqual({ text: TYPED.text, context: undefined })
})
