import DEFAULT_COLORS from './defaultColors'

let availableColors = [...DEFAULT_COLORS]
const colorMap: { [actorId: string]: string } = {}

const getActorColor = (actorId: string) => {
  if (!colorMap[actorId]) {
    const nextColor = availableColors.shift() as string
    if (availableColors.length === 0) {
      availableColors = [...DEFAULT_COLORS]
    }
    colorMap[actorId] = nextColor
  }
  return colorMap[actorId]
}

export default getActorColor
