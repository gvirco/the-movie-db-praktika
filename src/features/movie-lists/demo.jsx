import { createRoot } from 'react-dom/client'
import MovieLists from './MovieLists'

const input = document.querySelector('#preview-user')
const root = createRoot(document.querySelector('#movie-lists-root'))

function render() {
  root.render(<MovieLists userId={input.value.trim()} />)
}

input.addEventListener('change', render)
render()
