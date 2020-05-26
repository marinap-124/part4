var _ = require('lodash')


const dummy = () => {
  return 1
}

const totalLikes = (blogs) => {
  return blogs.reduce((sum, blog) => sum + blog.likes, 0)
}

const favoriteBlog = (blogs) => {
  return blogs.reduce((prev, current) => (prev.likes > current.likes) ? prev : current)
}

const mostLikes = (blogs) => {
  const groupedByAuthor = _.groupBy(blogs, 'author')
 
  const authorSumArr = _.map(groupedByAuthor, function(value, key) {
    let sum =  _.sumBy(value, 'likes')
    var info = { 'author': key,
      'likes': sum
    }
          
    return info
  })

  const mostBlogs = (arr) => {
    return arr.reduce((prev, current) => (prev.likes > current.likes) ? prev : current)
  }
     
  return mostBlogs(authorSumArr)
}


const mostBlogs= (blogs) => {
 
  return _.map( _.groupBy(blogs, 'author'), function(value, key) {
    let sum =  value.length
    var info = { 'author': key,
      'blogs': sum
    }
          
    return info
  })
    .reduce((prev, current) => (prev.likes > current.likes) ? prev : current)

}

 
module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes

}