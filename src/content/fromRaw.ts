import { AutomergeDoc } from '../components/Editor'
import Automerge from '@mattkrick/automerge'

const fromRaw = (raw: AutomergeDoc) => {
  return Automerge.load(raw)
}

export default fromRaw
