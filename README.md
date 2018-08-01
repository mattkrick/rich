# Rich - WORK IN PROGRESS

A decentralized collaborative rich text editor powered by DOM mutations, CRDT, and WebRTC

## Installation

`yarn add @mattkrick/rich`

## What is it

A collaborative rich text editor like google docs (without the google).


## How's it different from slate, quill, draft, prosemirror, ckeditor?

Those editors are _really_ smart. 
Rich doesn't compete by being smarter.
It competes by being dumber. 
A _lot_ dumber. 

For example, all other editors create their own proprietary schema.
The advanced ones even let you customize that schema!
Rich just uses the DOM schema.

To manage updates, other editors work by overriding the default content editable behavior.
For example, when you hit backspace, they'll intercept that `keydown` event, 
decide if they should remove a character or a whole line, 
and execute an operation to do that.
When that strategy fails (e.g. iOS spellcheck, android IME autosuggest) 
they have special handling for `input`/`beforeInput`/`onComposition` events. 

Rich has no special handling for different browsers or devices. 
It just serializes the DOM & shares it.
It's really that dumb. 
By focusing on the result instead of the input, it can handle edge cases, 
like the shake-your-phone-to-delete-a-word commands that you didn't even know existed.
It's also a lot smaller, faster, and easier to PR.

## Usage

See the playground or run `yarn dev`.
Open it in 2 browsers to test the collaborative editing.
Introduce a lag in sending changes to _really_ test the collaborative editing

## API

- `<Editor/>`: The primary component with the following properties
  - `content`: The document content, which is the result of `fromRaw`, `fromText`, or `fromJSON`
  - `remoteRangeMap`: A class that holds the positions of all the connected peers
  - `onChange`: a callback that Rich will call whenever the content or local range changes 

- `RemoteRangeMap(store?)`: a class to instantiate your remoteRangeMap
- 
## License

MIT


