// Stable, collision-resistant id for any entity (transaction, loan, reminder, account).
// These ids are persisted to the sheet's hidden "Id" column so the SAME row can be
// found in the other view's sheet for edit/delete mirroring, and so ids survive a pull.
let counter = 0

export function newId() {
  counter = (counter + 1) % 1000000
  return (
    Date.now().toString(36) +
    counter.toString(36) +
    Math.random().toString(36).slice(2, 6)
  )
}
