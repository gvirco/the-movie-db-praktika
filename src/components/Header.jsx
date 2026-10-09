function Header({ activePage, onNavigate, user, list }) {
  return <header className="site-header"><div className="site-header__content"><div><h1>MovieMatch</h1><p>Discover, save and remember movies.</p></div><nav aria-label="Main navigation">{['Discover Movies', 'My Movies', 'Users'].map((page) => <button key={page} className={activePage === page ? 'is-active' : ''} onClick={() => onNavigate(page)}>{page}</button>)}</nav><p className="site-header__selection">{user ? user.name : 'No profile selected'}{list ? ' · ' + list.name : ''}</p></div></header>
}
export default Header
