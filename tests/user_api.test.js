const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)
const bcrypt = require('bcrypt')
const User = require('../models/user')

describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({ username: { $ne: 'test' } })

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })

    await user.save()
  })

  test('luominen onnistuu uudella käyttäjätunnuksella', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'mehelin',
      name: 'Mehelin Mehelin',
      password: 'salainen',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const usernames = usersAtEnd.map((u) => u.username)
    expect(usernames).toContain(newUser.username)
  })

  test('luominen epäonnistuu oikealla tilakoodilla ja viestillä, jos käyttäjänimi on jo varattu', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'salainen',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('`käyttäjänimen` täytyy olla yksilöllinen')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })

  test('käyttäjänimi on lyhyempi kuin 3 merkkiä', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'R',
      name: 'Rumppis Pirpana',
      password: 'salainen',
    }

    await api.post('/api/users').send(newUser).expect(400)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })

  test('salasana on lyhyempi kuin 3 merkkiä ', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'Pumppis',
      name: 'Pumpulitassu Pumpuli',
      password: 'p',
    }

    await api.post('/api/users').send(newUser).expect(404)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })
})

afterAll(() => {
  mongoose.connection.close()
})
