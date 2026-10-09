import Header from '../components/Header'
import '../App.css'

const sections = [
  {
    title: 'Movie Search',
    description: 'Search for movies will be added here in a future iteration.',
  },
  {
    title: 'My Movies',
    description: 'Your personal movie collection will appear here.',
  },
  {
    title: 'Watchlists',
    description: 'Your saved watchlists will appear here.',
  },
]

function HomePage() {
  return (
    <div className="app-shell">
      <Header />
      <main className="main-content">
        <section className="intro" aria-labelledby="welcome-heading">
          <h2 id="welcome-heading">Your movie space</h2>
          <p>MovieMatch is ready for the group to build on.</p>
        </section>

        <div className="section-grid">
          {sections.map((section) => (
            <section className="placeholder-section" key={section.title}>
              <h3>{section.title}</h3>
              <p>{section.description}</p>
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}

export default HomePage
