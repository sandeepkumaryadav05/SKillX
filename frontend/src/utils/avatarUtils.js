/**
 * avatarUtils.js
 * Returns a consistent background + text color pair for a given string (name or email).
 * Uses a simple char-code hash so the same person always gets the same color.
 */

const COLOR_PAIRS = [
  { bg: '#EEEDFE', text: '#3C3489' }, // purple
  { bg: '#E1F5EE', text: '#085041' }, // teal
  { bg: '#FAEEDA', text: '#633806' }, // amber
  { bg: '#E6F1FB', text: '#0C447C' }, // blue
  { bg: '#EAF3DE', text: '#27500A' }, // green
  { bg: '#FAECE7', text: '#712B13' }, // coral
]

export const getAvatarColors = (str = '') => {
  if (!str) return COLOR_PAIRS[0]
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % COLOR_PAIRS.length
  return COLOR_PAIRS[index]
}

export const getAvatarInitials = (name = '', email = '') => {
  if (name && name.trim()) {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name[0].toUpperCase()
  }
  if (email) return email[0].toUpperCase()
  return '?'
}
