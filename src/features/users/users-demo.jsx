import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { UsersManager } from './UsersManager'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UsersManager onSelectUser={(user) => console.info('Selected user:', user)} />
  </StrictMode>,
)
