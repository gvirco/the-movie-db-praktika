import { useCallback, useEffect, useState } from 'react'

const usersUrl = import.meta.env.VITE_TESTAPI_USERS_URL?.trim()

function getUserUrl(id) {
  return `${usersUrl.replace(/\/$/, '')}/${encodeURIComponent(id)}`
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : 'Something went wrong.'
}

function validateUser(user) {
  const errors = {}

  if (!user.name.trim()) {
    errors.name = 'Name is required.'
  }

  if (!user.email.trim()) {
    errors.email = 'Email is required.'
  } else if (!/^\S+@\S+\.\S+$/.test(user.email)) {
    errors.email = 'Enter a valid email address.'
  }

  return errors
}

async function request(url, options) {
  const response = await fetch(url, options)

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}).`)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

const initialForm = { name: '', email: '' }

export function UsersManager({ onSelectUser }) {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(Boolean(usersUrl))
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')

  const loadUsers = useCallback(async () => {
    if (!usersUrl) {
      return
    }

    try {
      const data = await request(usersUrl)
      setUsers(Array.isArray(data) ? data : [])
      setError('')
    } catch (requestError) {
      setError(`Could not load users. ${getErrorMessage(requestError)}`)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timerId = window.setTimeout(loadUsers, 0)
    return () => window.clearTimeout(timerId)
  }, [loadUsers])

  function updateForm(event) {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(initialForm)
    setErrors({})
  }

  function selectUser(user) {
    setSelectedId(user.id)
    onSelectUser?.(user)
  }

  function startEdit(user) {
    setEditingId(user.id)
    setForm({ name: user.name ?? '', email: user.email ?? '' })
    setErrors({})
    selectUser(user)
  }

  async function submitForm(event) {
    event.preventDefault()
    const validationErrors = validateUser(form)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0 || !usersUrl) {
      return
    }

    const payload = { name: form.name.trim(), email: form.email.trim() }
    setIsSaving(true)
    setError('')

    try {
      if (editingId) {
        const updatedUser = await request(getUserUrl(editingId), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const user = { ...payload, ...updatedUser, id: updatedUser?.id ?? editingId }
        setUsers((currentUsers) => currentUsers.map((currentUser) => (
          currentUser.id === editingId ? user : currentUser
        )))
        selectUser(user)
      } else {
        const createdUser = await request(usersUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        setUsers((currentUsers) => [...currentUsers, createdUser])
      }

      cancelEdit()
    } catch (requestError) {
      setError(`Could not save user. ${getErrorMessage(requestError)}`)
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteUser(user) {
    if (!window.confirm(`Delete ${user.name}?`)) {
      return
    }

    setDeletingId(user.id)
    setError('')

    try {
      await request(getUserUrl(user.id), { method: 'DELETE' })
      setUsers((currentUsers) => currentUsers.filter((currentUser) => currentUser.id !== user.id))
      if (selectedId === user.id) {
        setSelectedId(null)
      }
      if (editingId === user.id) {
        cancelEdit()
      }
    } catch (requestError) {
      setError(`Could not delete user. ${getErrorMessage(requestError)}`)
    } finally {
      setDeletingId(null)
    }
  }

  if (!usersUrl) {
    return (
      <section style={styles.manager}>
        <h1>Users management</h1>
        <p role="status" style={styles.setupMessage}>
          Set VITE_TESTAPI_USERS_URL in .env.local to connect the users collection.
        </p>
      </section>
    )
  }

  return (
    <section style={styles.manager}>
      <h1>Users management</h1>

      <form onSubmit={submitForm} style={styles.form} noValidate>
        <h2>{editingId ? 'Edit user' : 'Add user'}</h2>
        <label style={styles.label}>
          Name
          <input name="name" value={form.name} onChange={updateForm} aria-invalid={Boolean(errors.name)} />
          {errors.name && <span style={styles.fieldError}>{errors.name}</span>}
        </label>
        <label style={styles.label}>
          Email
          <input name="email" type="email" value={form.email} onChange={updateForm} aria-invalid={Boolean(errors.email)} />
          {errors.email && <span style={styles.fieldError}>{errors.email}</span>}
        </label>
        <div style={styles.actions}>
          <button type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : editingId ? 'Save changes' : 'Create user'}</button>
          {editingId && <button type="button" onClick={cancelEdit}>Cancel</button>}
        </div>
      </form>

      {error && <p role="alert" style={styles.error}>{error}</p>}
      {isLoading ? (
        <p role="status">Loading users…</p>
      ) : users.length === 0 ? (
        <p role="status">No users yet. Create the first user above.</p>
      ) : (
        <ul style={styles.list}>
          {users.map((user) => (
            <li key={user.id} style={styles.user}>
              <button type="button" onClick={() => selectUser(user)} style={styles.selectButton} aria-pressed={selectedId === user.id}>
                <strong>{user.name}</strong><br />
                <span>{user.email}</span>
              </button>
              <div style={styles.actions}>
                <button type="button" onClick={() => startEdit(user)}>Edit</button>
                <button type="button" onClick={() => deleteUser(user)} disabled={deletingId === user.id}>
                  {deletingId === user.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

const styles = {
  manager: { maxWidth: '680px', margin: '2rem auto', padding: '1.5rem', fontFamily: 'Arial, sans-serif' },
  form: { display: 'grid', gap: '0.75rem', padding: '1rem', border: '1px solid #ccd3dd', borderRadius: '8px' },
  label: { display: 'grid', gap: '0.25rem', fontWeight: '600' },
  actions: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  fieldError: { color: '#b42318', fontSize: '0.875rem' },
  error: { color: '#b42318' },
  setupMessage: { padding: '1rem', background: '#fff4ce', borderRadius: '6px' },
  list: { display: 'grid', gap: '0.75rem', padding: 0, listStyle: 'none' },
  user: { display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '1rem', border: '1px solid #ccd3dd', borderRadius: '8px' },
  selectButton: { flex: 1, textAlign: 'left', border: 0, background: 'transparent', cursor: 'pointer' },
}
