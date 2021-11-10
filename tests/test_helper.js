const Blog = require("../models/blog");
const User = require("../models/user");

const initialBlogs = [
  {
    title: "Joku Blogi",
    author: "Susanna",
    url: "joku_blog.com",
    likes: 11,
    id: "706dd1r1fcd684120a2aarr3",
  },
  {
    title: "Blog",
    author: "MH",
    url: "blogblog.com",
    likes: 400,
    id: "706dd1r1fcd684120a2aarr3",
  },
];

const nonExistingId = async () => {
  const blog = new Blog({
    title: "Test Blog",
    author: "VIP",
    url: "google.com",
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
