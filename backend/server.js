// Local development only. Vercel uses api/index.js.
import 'dotenv/config'
import app from './app.js'

const port = process.env.PORT || 4000

app.listen(port, () => console.log(`api listening on http://localhost:${port}/api`))
