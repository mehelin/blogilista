const Blog = require('../models/blog');
const User = require('../models/user');

const initialBlogs = [
  {
    title: 'Go To Harmful',
    author: 'Edsger',
    url: 'www.harmful.com',
    likes: 15,
    _id: '5a422aa71b54a676234d17f8'
  },
  {
    title: 'Canonical',
    author: 'Dijkstra',
    url: 'www.blogdij.com',
    likes: 100,
    _id: '5a422b3a1b54a676234d17f9'
  }
];


const nonExistingId = async () => {
  const blog = new Blog({
    title: 'Test Blog',
    author: 'VIP',
    url: 'google.com',
  });
  await blog.save();
  await blog.remove();

  return blog.id.toString();
};

const blogsInDb = async () => {
  const blogs = await Blog.find({});
  return blogs.map((blog) => blog.toJSON());
};

const usersInDb = async () => {
  const users = await User.find({});
  return users.map((u) => u.toJSON());
};

module.exports = {
  initialBlogs,
  nonExistingId,
  blogsInDb,
  usersInDb,
};