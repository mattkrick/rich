import { parse } from 'himalaya'
import fromJSON from './fromJSON'

const fromText = (text: string) => {
  const html = `<div>${text}</div>`
  const json = parse(html)[0]
  // TODO crawl tree to rename class to className
  return fromJSON(json)
}

export default fromText
