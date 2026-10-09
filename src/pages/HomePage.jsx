import { useState } from 'react'
import Header from '../components/Header'
import { MovieDiscovery } from '../features/movie-discovery/MovieDiscovery'
import MovieLists from '../features/movie-lists/MovieLists'
import { getMovieLists } from '../features/movie-lists/api'
import { UsersManager } from '../features/users/UsersManager'
import '../App.css'

function HomePage() {
  const [page, setPage] = useState('Discover Movies')
  const [user, setUser] = useState(null)
  const [list, setList] = useState(null)
  const [pendingMovie, setPendingMovie] = useState(null)
  function chooseUser(nextUser) { setUser(nextUser); setList(null) }
  async function validateUserDeletion(candidate) {
    const lists = await getMovieLists(candidate.id)
    if (lists.length) throw new Error('Delete this user’s ' + lists.length + ' movie list(s) first. This prevents orphaned lists and saved movies.')
  }
  function chooseMovie(movie) {
    if (!user) { setPage('Users'); return }
    setPendingMovie(movie); setPage('My Movies')
  }
  return <div className="app-shell"><Header activePage={page} onNavigate={setPage} user={user} list={list} /><main className="main-content">
    {page === 'Discover Movies' && <MovieDiscovery onSelectMovie={chooseMovie} />}
    {page === 'My Movies' && <MovieLists key={user?.id || 'no-user'} userId={user?.id} onSelectList={setList} pendingMovie={pendingMovie} onPendingMovieSaved={() => setPendingMovie(null)} />}
    {page === 'Users' && <UsersManager selectedUserId={user?.id} onSelectUser={chooseUser} onBeforeDelete={validateUserDeletion} />}
  </main></div>
}
export default HomePage
