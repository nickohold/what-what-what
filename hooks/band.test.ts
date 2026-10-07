import { expect, test } from 'claude-code/testing'

const ANSWER = [
  'The deploy is still running.',
  '',
  'what am i doing right now: waiting for the staging deploy to finish.',
  'for what higher goal: the new search page checked on staging.',
  'what is needed from you: nothing.',
].join('\n')

for (const surface of ['terminal', 'desktop'] as const) {
  test(`on ${surface} the band draws each line in its own box, each box after the first sharing the border above`, async ($, on) => {
    on('turn.complete', (_$, e) => ({ text: e.answer }))
    await $.turn.complete({ answer: ANSWER, durationMs: 1, isAborted: false, turnId: 't1', reason: 'answer' })

    const band = await $.ui.mount({
      plugin: 'what-what-what',
      surface,
      component: 'AbovePrompt',
      props: {
        hasSurvey: false,
        isWorking: false,
        maxRows: 20,
        bodyColumns: 80,
        scroll: { offset: 0, bodyRows: 19 },
        view: {},
      },
    })

    const boxes = (await band.findAll({ type: 'Box' })).slice(1)

    expect(boxes.map(box => box.props?.marginTop)).toEqual([0, -1, -1])
    expect(boxes.map(box => box.text)).toEqual([
      'what am i doing right now: waiting for the staging deploy to finish.',
      'for what higher goal: the new search page checked on staging.',
      'what is needed from you: nothing.',
    ])
  })
}
