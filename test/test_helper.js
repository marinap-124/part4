const Blog = require('../models/blog')
const User = require('../models/user')


const initialBlogs = [
  {
    title: 'HTML is easy',
    author: 'Pekka',
    url: 'html://pekanblog.com',
    likes: 6
  },
  {
    title: 'Browser can execute only Javascript',
    author: 'Markku',
    url: 'html://markunblogi.com',
    likes: 6
  },
]



const nonExistingId = async () => {
  const blog = new Blog({ title: 'willremovethissoon' })
  await blog.save()
  await blog.remove()

  return blog._id.toString()
}

const blogsInDb = async () => {
  const blogs = await Blog.find({})
  return blogs.map(blog => blog.toJSON())
}

const usersInDb = async () => {
  const users = await User.find({})
  return users.map(u => u.toJSON())
}

module.exports = {
  initialBlogs, 
  nonExistingId, 
  blogsInDb,
  usersInDb
}