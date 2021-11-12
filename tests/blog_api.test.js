const mongoose = require('mongoose');
const supertest = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const helper = require('./test_helper');
const app = require('../app');
const api = supertest(app);

const Blog = require('../models/blog');
const User = require('../models/user');

// Alustetaan tietokanta ennen jokaisen testin suoritusta, eli tietokanta tyhjentyy
beforeEach(async () => {
  await Blog.deleteMany({});

  for (let blog of helper.initialBlogs) {
    let blogObject = new Blog(blog);
    await blogObject.save();
  }
});

describe('when there is initially some blogs saved', () => {
  test('blogs are returned as json', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/);
  });

  test('there are right amount of blogs', async () => {
    const response = await api.get('/api/blogs');

    expect(response.body).toHaveLength(helper.initialBlogs.length);
  });

  test('a specific title is within the returned blogs', async () => {
    const response = await api.get('/api/blogs');

    const contents = response.body.map((r) => r.title);
    expect(contents).toContain('My New Blog');
  });
});

describe('viewing a specific blog', () => {
  test('blog has a unique id named \'id\'', async () => {
    const response = await api.get('/api/blogs');

    expect(response.body[0].id).toBeDefined();
  });

  test('a specific blog can be viewed', async () => {
    const blogsAtStart = await helper.blogsInDb();
    const blogToView = blogsAtStart[0];

    const resultBlog = await api
      .get(`/api/blogs/${blogToView.id}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);
    const processedBlogToView = JSON.parse(JSON.stringify(blogToView));

    expect(resultBlog.body).toEqual(processedBlogToView);
  });

  test('fails with statuscode 404 if blog does not exist', async () => {
    const validNonexistingId = await helper.nonExistingId();

    await api.get(`/api/blogs/${validNonexistingId}`).expect(404);
  });

  test('fails with statuscode 400 if id is invalid', async () => {
    const invalidId = '5e3d5da99070081a82a5667';

    await api.get(`/api/blogs/${invalidId}`).expect(400);
  });
});

describe('addition of a new blog', () => {
  let token = null;
  beforeAll(async () => {
    await User.deleteMany({});

    const testUser = await new User({
      username: 'Suklaahipputassu',
      passwordHash: await bcrypt.hash('suklaa', 10),
    }).save();

    const userForToken = { username: 'Suklaahipputassu', id: testUser.id };
    token = jwt.sign(userForToken, process.env.SECRET);
    return token;
  });

  test('a valid blog can be added', async () => {
    const newBlog = {
      title: 'Blog Blog block',
      author: 'MJH',
      url: 'bbb.net',
      likes: 100,
      userId: '5a422bc61b54a676234d17fc',
    };

    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const blogsAfterAdding = await helper.blogsInDb();

    const contents = blogsAfterAdding.map((blog) => blog.title);
    expect(contents).toContain('A Brilliant Blog');

    expect(blogsAfterAdding).toHaveLength(helper.initialBlogs.length + 1);
  });

  test('if request has no likes property likes are set to 0', async () => {
    const newBlog = {
      title: 'Nojaa',
      author: 'Puppu Pallo',
      url: 'toupper.case',
      userId: '5a422bc61b54a676234d17fc',
    };

    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const blogsAfterAdding = await helper.blogsInDb();
    const likesOfAdedBlog = blogsAfterAdding[blogsAfterAdding.length - 1].likes;

    expect(likesOfAdedBlog).toBe(0);
  });

  test('if request has no title and url properties -> 400 Bad Request', async () => {
    const newBlog = {
      author: 'Puppu Pallo',
      likes: 1,
      userId: '5a422bc61b54a676234d17fc',
    };

    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(400);
  });


  test('blog without content is not added', async () => {
    const newBlog = { userId: '5a422bc61b54a676234d17fc' };

    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(400);

    const blogsAtEnd = await helper.blogsInDb();
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length);
  });
});

describe('deletion of a blog', () => {
  let token = null;
  beforeEach(async () => {
    await Blog.deleteMany({});
    await User.deleteMany({});

    const testUser = await new User({
      username: 'Suklaahipputassu',
      passwordHash: await bcrypt.hash('suklaa', 10),
    }).save();

    const userForToken = { username: 'Suklaahipputassu', id: testUser.id };
    token = jwt.sign(userForToken, process.env.SECRET);

    const newBlog = {
      title: 'Pupulandia',
      author: 'Pumpuli',
      url: 'mehelin.com',
    };

    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(200);

    return token;
  });

  test('a blog can be deleted', async () => {
    const blogsAtStart = await helper.blogsInDb();
    const blogToDelete = blogsAtStart[0];

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);
    const blogsAtEnd = await helper.blogsInDb();

    expect(blogsAtEnd).toHaveLength(0);

    const contents = blogsAtEnd.map((r) => r.title);

    expect(contents).not.toContain(blogToDelete.title);
  });
});

describe('updating of a blog', () => {

  test('blog can be updated', async () => {
    const newBlog = {
      title: 'Pupumaa',
      author: 'RumppisPumppis',
      url: 'pumppisrumppis.net',
      likes: 9000,
    };

    const initialBlogs = await helper.blogsInDb();
    const blogToUpdate = initialBlogs[0];

    await api.put(`/api/blogs/${blogToUpdate.id}`).send(newBlog).expect(200);

    const blogsAfterUpdating = await helper.blogsInDb();

    const updatedBlog = blogsAfterUpdating[0];

    expect(blogsAfterUpdating).toHaveLength(helper.initialBlogs.length);

    expect(updatedBlog.likes).toBe(2000);
    expect(updatedBlog.author).toBe('RumppisPumppis');
  });
});

afterAll(() => {
  mongoose.connection.close();
});
