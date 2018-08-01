// // Don't bother updating something if we're just going to remove it
// const simplifyCharQueue = (detachQueue: DetachQueue, charQueue: CharQueue) => {
//   return charQueue
//   if (!detachQueue.length || !charQueue.length) return charQueue
//   let isMatch = false
//   for (let ii = charQueue.length - 1; ii >= 0; ii--) {
//     const target = charQueue[ii]
//     for (let jj = detachQueue.length - 1; jj >= 0; jj--) {
//       const detachment = detachQueue[jj]
//       if (target === detachment.node) {
//         isMatch = true
//         charQueue[ii] = undefined
//         break
//       }
//     }
//   }
//   return isMatch ? charQueue.filter(Boolean) : charQueue
// }
//
// export default simplifyCharQueue
