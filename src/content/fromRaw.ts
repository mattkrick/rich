import Automerge from 'automerge'

const fromRaw = (raw: string) => {
  return Automerge.load(raw)
}

export default fromRaw
