# what-what-what

A Claude Code mod that keeps three lines in view above your prompt, so you always know where a session stands without scrolling or asking:

```
what am i doing right now: running the test suite after the rename.
for what higher goal: the search page shipped and checked on staging.
what is needed from you: nothing.
```

During long work it is easy to lose track of what Claude is doing, why, and whether it is waiting on you. This mod makes Claude end every reply with those three answers and pins the latest ones in a coloured band above the prompt. The lines are hidden from the transcript, so they are not repeated under every reply.

## Install

In a Claude Code terminal session, type:

```
/plugin install what-what-what --marketplace nickohold/what-what-what
```

Answer `y` to add the marketplace, then pick a scope (the user scope turns it on for every session). The mod is active from that moment; the band appears after Claude's next reply.

Works in Claude Code in the terminal and in the desktop app's Code tab.

## How it behaves

- **Claude is told to write the three lines.** The mod sends a short instruction alongside every prompt, where you never see it, in every session that has a screen. Nothing needs to go in your `CLAUDE.md`. It rides with each prompt because a session that is already deep into a conversation ignores the same instruction when it only sits in the system prompt.
- **The band shows the latest three lines** and updates after every reply. A reply without all three lines leaves the previous ones standing.
- **The transcript hides them.** Only the drawing changes; the stored message still has them.
- **Headless runs are left alone.** `claude -p` and SDK sessions have no band, so they are not asked to add the lines to their output. Subagent replies are ignored.

## Development

```
claude plugin validate .
claude plugin test .
```

The three labels live in one place, `KEYS` in `hooks/footer.ts`. The instruction Claude receives and the parser that reads its replies are both built from it.

## License

MIT
