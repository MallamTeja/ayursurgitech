import { Router } from 'express'
import { users } from '../lib/store.js'
import { requireUser } from '../lib/auth.js'

const router = Router()

// The password never leaves the server. This was a toJSON transform on the schema.
const publicUser = ({ password, ...user }) => user

// The token is the user's _id. See the ponytail note in lib/auth.js.
const session = (user) => ({ token: String(user._id), user: publicUser(user) })

router.post('/auth/register', async (req, res) => {
  const { name, phone, password } = req.body ?? {}
  if (!name || !phone || !password) return res.status(400).json({ error: 'Name, phone and password are all required' })
  if (await users.findOne({ phone })) return res.status(409).json({ error: 'That phone number is already registered' })

  res.status(201).json(session(await users.insert({ name, phone, password })))
})

router.post('/auth/login', async (req, res) => {
  const { phone, password } = req.body ?? {}
  if (!phone || !password) return res.status(400).json({ error: 'Phone and password are required' })

  const user = await users.findOne({ phone })
  if (!user || user.password !== password) return res.status(401).json({ error: 'Wrong phone number or password' })

  res.json(session(user))
})

router.get('/auth/me', requireUser, (req, res) => res.json(publicUser(req.user)))

export default router
