import { useState } from 'react'
import { ArrowLeft, Save, Camera } from 'lucide-react'
import userService from '../services/userService'

export default function EditProfilePage({ onBack }) {
  const [profile] = useState(() => userService.getUserProfile())
  const [name, setName] = useState(profile.username || ''), [bio, setBio] = useState(profile.bio || ''), [avatar, setAvatar] = useState(profile.avatar || '')
  const [error, setError] = useState('')
  const selectAvatar = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) { setError('Choose a PNG, JPG, or WebP image under 2 MB.'); return }
    const reader = new FileReader()
    reader.onload = () => { setAvatar(reader.result); setError('') }
    reader.onerror = () => setError('Could not read the image.')
    reader.readAsDataURL(file)
  }
  const save = (event) => {
    event.preventDefault()
    if (!name.trim()) { setError('Enter your name.'); return }
    const result = userService.saveUserProfile({ ...profile, username: name.trim(), bio: bio.trim(), avatar })
    if (result.success) onBack()
    else setError('Could not save your profile. Check browser storage and try again.')
  }
  return <div className="feature-page"><button className="detail-back" onClick={onBack}><ArrowLeft size={17} /> Back to Profile</button>
    <section className="masthead"><h1 className="display">Edit profile</h1><p className="lede">Update your name, bio, and avatar in one place.</p></section>
    <form className="profile-form" onSubmit={save}>{error && <p role="alert" className="form-error">{error}</p>}
      {avatar && <img src={avatar} alt="Avatar preview" className="profile-avatar" />}
      <label className="form-label" htmlFor="profile-avatar"><Camera size={16} /> Profile picture</label><input id="profile-avatar" type="file" accept="image/png,image/jpeg,image/webp" onChange={selectAvatar} />
      <div className="form-group"><label htmlFor="profile-name" className="form-label">Name</label><input id="profile-name" className="form-input" maxLength={60} required value={name} onChange={(event) => setName(event.target.value)} /></div>
      <div className="form-group"><label htmlFor="profile-bio" className="form-label">Bio</label><textarea id="profile-bio" className="form-textarea" rows={4} maxLength={300} value={bio} onChange={(event) => setBio(event.target.value)} /></div>
      <div className="inline-actions"><button className="btn btn--primary"><Save size={16} /> Save profile</button><button type="button" className="btn btn--outline" onClick={onBack}>Cancel</button></div>
    </form>
  </div>
}
