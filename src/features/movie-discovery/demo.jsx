import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../../index.css'
import { MovieDiscovery } from './MovieDiscovery'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MovieDiscovery onSelectMovie={(movie) => window.alert(`Ready to save: ${movie.title} (TMDB ${movie.tmdbId})`)} />
  </StrictMode>,
)
