const express = require('express')
const { check } = require('express-validator')
const router = express.Router()
const blogControllers = require('../controllers/blog')

router.get('/get/blogs', blogControllers.fetchAllBlogs)
router.post('/blogview/:id', blogControllers.fetchParticularBlog)
router.get('/blogsearch/:query', blogControllers.fetchQueriedBlog)




module.exports = router