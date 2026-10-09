import { useCallback, useEffect, useState } from 'react'
import './users.css'

const usersUrl = import.meta.env.VITE_TESTAPI_USERS_URL?.trim()
const initialForm = { name: '', email: '' }
function records(data) { return Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : Array.isArray(data?.records) ? data.records : data ? [data] : [] }
function userFrom(data, fallback = {}) { const value = data?.data || data; return { ...fallback, ...value, id: value?.id ?? fallback.id } }
function userUrl(id) { return `${usersUrl.replace(/\/$/, '')}/${encodeURIComponent(id)}` }
function validate({ name, email }) { const errors = {}; if (!name.trim()) errors.name = 'Name is required.'; if (!email.trim()) errors.email = 'Email is required.'; else if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Enter a valid email address.'; return errors }
async function request(url, options) { const response = await fetch(url, options); if (!response.ok) throw new Error(`Request failed (${response.status}).`); return response.status === 204 ? null : response.json() }

export function UsersManager({ onSelectUser, selectedUserId, onBeforeDelete }) {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(Boolean(usersUrl))
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')
  const loadUsers = useCallback(async () => { if (!usersUrl) return; try { setUsers(records(await request(usersUrl))); setError('') } catch (cause) { setError(`Could not load users. ${cause.message}`) } finally { setIsLoading(false) } }, [])
  useEffect(() => { const timerId = window.setTimeout(loadUsers, 0); return () => window.clearTimeout(timerId) }, [loadUsers])
  function selectUser(user) { onSelectUser?.(user) }
  function cancelEdit() { setEditingId(null); setForm(initialForm); setErrors({}) }
  function startEdit(user) { setEditingId(user.id); setForm({ name: user.name ?? '', email: user.email ?? '' }); setErrors({}); selectUser(user) }
  async function submitForm(event) {
    event.preventDefault()
    const nextErrors = validate(form); setErrors(nextErrors)
    if (Object.keys(nextErrors).length || !usersUrl) return
    const payload = { name: form.name.trim(), email: form.email.trim() }
    setIsSaving(true); setError('')
    try {
      if (editingId) {
        const user = userFrom(await request(userUrl(editingId), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }), { ...payload, id: editingId })
        setUsers((current) => current.map((item) => String(item.id) === String(editingId) ? user : item)); selectUser(user)
      } else {
        const user = userFrom(await request(usersUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }), payload)
        if (!user.id) throw new Error('The API did not return the new user ID.')
        setUsers((current) => [...current, user]); selectUser(user)
      }
      cancelEdit()
    } catch (cause) { setError(`Could not save user. ${cause.message}`) } finally { setIsSaving(false) }
  }
  async function deleteUser(user) {
    if (!window.confirm(`Delete ${user.name}? Movie lists must be deleted first.`)) return
    setDeletingId(user.id); setError('')
    try {
      await onBeforeDelete?.(user); await request(userUrl(user.id), { method: 'DELETE' })
      setUsers((current) => current.filter((item) => String(item.id) !== String(user.id)))
      if (String(selectedUserId) === String(user.id)) selectUser(null)
      if (String(editingId) === String(user.id)) cancelEdit()
    } catch (cause) { setError(`Could not delete user. ${cause.message}`) } finally { setDeletingId(null) }
  }
  if (!usersUrl) return <section className="users-manager"><h2>Users</h2><p className="users-manager__setup" role="status">Set VITE_TESTAPI_USERS_URL in .env.local to connect the users collection.</p></section>
  return <section className="users-manager" aria-labelledby="users-title">
    <h2 id="users-title">Profiles</h2><p className="users-manager__intro">Choose a profile for this session. This is not secure login.</p>
    <form onSubmit={submitForm} className="users-manager__form" noValidate><h3>{editingId ? 'Edit profile' : 'Create profile'}</h3><label>Name<input name="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} aria-invalid={Boolean(errors.name)} />{errors.name && <span>{errors.name}</span>}</label><label>Email<input name="email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} aria-invalid={Boolean(errors.email)} />{errors.email && <span>{errors.email}</span>}</label><div><button type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : editingId ? 'Save changes' : 'Create profile'}</button>{editingId && <button type="button" className="users-manager__secondary" onClick={cancelEdit}>Cancel</button>}</div></form>
    {error && <p className="users-manager__error" role="alert">{error}</p>}
    {isLoading ? <p role="status">Loading profiles…</p> : users.length === 0 ? <p role="status">No profiles yet. Create one to start saving movies.</p> : <ul className="users-manager__list">{users.map((user) => <li key={user.id} className={String(selectedUserId) === String(user.id) ? 'is-selected' : ''}><button type="button" className="users-manager__select" onClick={() => selectUser(user)} aria-pressed={String(selectedUserId) === String(user.id)}><strong>{user.name}</strong><span>{user.email}</span></button><div><button type="button" onClick={() => startEdit(user)}>Edit</button><button type="button" onClick={() => deleteUser(user)} disabled={deletingId === user.id}>Delete</button></div></li>)}</ul>}
  </section>
}
