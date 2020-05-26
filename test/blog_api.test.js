const bcrypt = require('bcrypt')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const helper = require('./test_helper')

const Blog = require('../models/blog')
const User = require('../models/user')
let token
let userCreated



beforeAll(async (done) => {

  const secret = 'sekret'
  const saltRounds = 10
  const passwordHash = await bcrypt.hash(secret, saltRounds)

  const user = new User({
    username: 'test',
    name: 'name',
    passwordHash,
  })

  userCreated =  await user.save()
  
  supertest(app)
    .post('/api/login')
    .send({
      username: user.username,
      password: secret
    })
    .end((err, response) => {
      token = response.body.token
      done()
    })
})

beforeEach(async () => {
  await Blog.deleteMany({})
  for (let blog of helper.initialBlogs) {
    let blogObject = new Blog(blog)
    blogObject.user = userCreated.id
    await blogObject.save()
  }
})

test('blogs are returned as json', async () => {
  await api
    .get('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .expect('Content-Type', /application\/json/)
})
  
test('the first blog is about HTTP methods', async () => {
  const response = await api.get('/api/blogs')  
  expect(response.body[0].title).toBe('HTML is easy')
})

test('all blogs are returned', async () => {
  const response = await api.get('/api/blogs') 
  expect(response.body).toHaveLength(helper.initialBlogs.length)
})
  
test('a specific blog is within the returned blogs', async () => {
  const response = await api.get('/api/blogs')
  
  const titles = response.body.map(r => r.title)
  
  expect(titles).toContain(
    'Browser can execute only Javascript'
  )
})

test('a valid blog can be added ', async () => {
  const newBlog = {
    title: 'async/await simplifies making async calls',
    author: 'Marina',
    url: 'http://marinablog.com',
    likes: 0
  }
  
  await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlog)
    .expect(200)
    .expect('Content-Type', /application\/json/)
 
  const blogsAtEnd = await helper.blogsInDb()

  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)
  const titles = blogsAtEnd.map(r => r.title)
  expect(titles).toContain(
    'async/await simplifies making async calls'
  )
})

test('blog without title and url is not added', async () => {
  const newBlog = {
    author: 'Marina',
    likes: 0
  }
  
  await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlog)
    .expect(400)
  
  const blogsAtEnd = await helper.blogsInDb()
  
  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
})

test('a specific blog can be viewed', async () => {
  const blogsAtStart = await helper.blogsInDb()
  
  const blogToView = blogsAtStart[0]
  
  const resultBlog = await api
    .get(`/api/blogs/${blogToView.id}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .expect('Content-Type', /application\/json/)
  
  expect(resultBlog.body.title).toEqual(blogToView.title)
})
  
test('a blog can be deleted', async () => {
  const blogsAtStart = await helper.blogsInDb()
  const blogToDelete = blogsAtStart[0]
  
  await api
    .delete(`/api/blogs/${blogToDelete.id}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(204)
  
  const blogsAtEnd = await helper.blogsInDb()
  
  expect(blogsAtEnd).toHaveLength(
    helper.initialBlogs.length - 1
  )
  
  const titles = blogsAtEnd.map(r => r.title)
  
  expect(titles).not.toContain(blogToDelete.title)
})

test('id toBeDefined', async () => {
  const response = await api.get('/api/blogs')
  
  expect(response.body[0].id).toBeDefined()
})

test('a blog without likes can be added ', async () => {
  const newBlog = {
    title: 'a blog without likes can be added',
    author: 'Marina',
    url: 'http://marinablog.com'
  }
  
  await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlog)
    .expect(200)
    .expect('Content-Type', /application\/json/)
 
  const blogsAtEnd = await helper.blogsInDb()
    
  const filtered = blogsAtEnd.filter(bl => bl.title === 'a blog without likes can be added')
  expect(filtered).toHaveLength(1)
  expect(filtered[0].likes).toEqual(0)

})  

test('a blog can be updated', async () => {
  const newBlog = {
    title: 'a blog can be updated',
    author: 'Marina',
    url: 'http://marinablog.com',
    likes: 2
  }
  
  await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlog)
    .expect(200)
    .expect('Content-Type', /application\/json/)
 
  const blogsAtEnd = await helper.blogsInDb()
    
  const filtered = blogsAtEnd.filter(bl => bl.title === 'a blog can be updated')
  expect(filtered).toHaveLength(1)
  const blogToUpdate = filtered[0]
  expect(blogToUpdate.likes).toEqual(2)

  blogToUpdate.likes = 3

  const response = await api
    .put(`/api/blogs/${blogToUpdate.id}`)
    .set('Authorization', `Bearer ${token}`)
    .send(blogToUpdate)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  expect(response.body.likes).toBe(3)

}) 

test('a blog cannot be added without authorization ', async () => {
  const newBlog = {
    title: 'a blog cannot be added without authorization',
    author: 'Marina',
    url: 'http://marinablog.com',
    likes: 0
  }
  
  const response = await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(401)
    .expect('Content-Type', /application\/json/)
 
  expect(response.body.error).toContain('invalid token')
})

afterAll(async () => {
  await Blog.deleteMany({})
  await User.deleteMany({})
  mongoose.connection.close()
})