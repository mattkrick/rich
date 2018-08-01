## Easiest PRs Ever

Easier PRs mean a stronger community.
Rich is the easiest text editor to PR.


## Debugging / Adding Features

`yarn build & yarn run dev`

Rich was built using the included playground.
It has the following features:
- **Perfect source maps** (the playground compiles Rich from source to guarantee this)
- **Built-in watcher** (`yarn build` uses the webpack watcher so changes to Rich propagate to the playground)
- **Built-in centralized server** (for testing collaborative editing) 
  - if testing on multiple devices, just change the ip address in `App.tsx` to your local network IP
  - if testing on mobile devices, do the above, plug in via usb, enable usb debugging, and use Chrome > Debugger > Remote Devices

## Reporting bugs

Reproducing bugs in text editors can be tricky!
Rich makes it easy.
Just list the steps necessary to reproduce the bug in the playground.
For complex bugs, you may need to PR the playground in order to reproduce. That's OK!
Just open a PR with steps to reproduce the bug.
