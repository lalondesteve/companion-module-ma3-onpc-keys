# grandMA3 onPC Keys

Companion module that presses grandMA3 console hardware keys, special executors, and numbered executors in grandMA3 onPC, without onPC needing window focus.

## How it works

Each press runs one line of Lua inside onPC on the configured display:

```lua
Keyboard(<display>, 'press'|'release', '<key>', shift, ctrl, alt)
```

- **Hardware keys & executors:** dispatched by grandMA3 `KeyCode` (and `ExecutorIndex` / `SpecialExec`). If the configured user's `KeyboardShortCuts` profile already has a usable shortcut for that key, onPC uses it directly; otherwise the module binds a temporary unused `Ctrl+Alt+<key>` shortcut for the moment of the press and deletes it right after.
- **ShCuts preservation:** `KeyboardShortcutsActive` is enabled only for the duration of the `Keyboard()` call and immediately restored, so your computer keyboard keeps behaving as before.
- **MA key combinations:** holding the `MA` (`MA1`) or `MA 2` (`MA2`) preset holds the actual MA virtual key inside onPC, so pressing any other key while holding `MA` triggers its MA combination just like on a console.
- **ShCuts on/off & Desk Lock:** `ShCuts on/off` toggles `KeyboardShortcutsActive` directly; `Desk Lock` sends onPC's `F9` framework shortcut.

The Lua reaches onPC by one of two routes:

- **OSC**: `/cmd,s,Lua "..."` over UDP. In onPC, go to Menu → In & Out → OSC. Add a line with the port, set Receive Command to Yes, pick the interface, and turn on Enable Input.
- **grandMA3 Terminal**: a persistent `app_terminal` session logged in with `cmdline <ip>`.

The default **OSC first** mode probes OSC every 15 s by setting a global variable over OSC and reading it back through the terminal. It uses OSC when commands get through and falls back to the terminal otherwise.

## Actions

- **Hardware key:** all 144 grandMA3 `SCVirtualKeyCode` keys (Command & edit, Syntax & numbers, Objects, Playback, Modes & system, Navigation / grid / MAtricks, X1–X16, Encoders 1–5 inside/outside, onPC Displays 2–7), 15 Special Executor buttons/encoders (Blackout / GrandKnob, XFade A/B, Master Rate/Speed, Exec Time, Prog Time), plus `ShCuts on/off` and `Desk Lock`.
- **Executor key:** press, release, or tap any numbered executor (`101`–`490`) on the current page.
- **Custom shortcut:** send any raw MA shortcut notation such as `S`, `Ctrl+Alt+S`, `Delete`, or `F10`.

## Presets

Every hardware key, special executor, and Wing 1 executor (`101`–`115`, `201`–`215`, `301`–`315`, `401`–`415`) has a preset that presses on button down and releases on button up (except `ShCuts on/off`, which toggles on press). The **Keypad** group is ordered for a 4-wide block:

```
7  8  9  Store
4  5  6  Clear
1  2  3  MA
0  .  Please
```

## Config

| Field                        | Default                                                                   |
| ---------------------------- | ------------------------------------------------------------------------- |
| Transport                    | OSC first, Terminal fallback                                              |
| onPC IP / OSC port           | 127.0.0.1 / 8081                                                          |
| User (whose ShCuts are used) | steve                                                                     |
| Display                      | 1                                                                         |
| Terminal executable          | `/Applications/grandMA3 Terminal 2.5.1.1.app/Contents/MacOS/app_terminal` |
