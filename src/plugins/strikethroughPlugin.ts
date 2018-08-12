import RichDoc from '../RichDoc'

const strikeThroughPlugin = (doc: RichDoc) => ({
  onKeyDown: (event: KeyboardEvent): boolean | void => {
    if (event.shiftKey && event.ctrlKey && event.key === 'x') {
      doc.toggleStyle({ textDecoration: 'line-through' })
    }
  }
})

export default strikeThroughPlugin
