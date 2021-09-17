const HttpError = require('../models/http-error')
const Blog = require('../models/blog');
const User = require('../models/user');


const fetchAllBlogs = async (req, res, next) => {
    let blogs
    try {
        blogs = await Blog.find()
    } catch (err) {
        const error = new HttpError('Something Went wrong,please try again', 500)
        return next(error)
    }
    if (!blogs || blogs.length === 0) {
        return next(new HttpError('Cound not find any blogs'))
    }
    blogs.forEach(a => a.blog = undefined)
    res.json({ blogs: blogs.map(b => b.toObject({ getters: true })) })
}

const fetchParticularBlog = async (req, res, next) => {
    const blogId = req.params.id
    const {userid} = req.body
    let blog
    try{
        blog = await Blog.findById(blogId)
    } catch (err) {
        const error = new HttpError('Something Went wrong,please try again', 500)
        return next(error)
    }
    if (!blog || blog.length === 0) {
        return next(new HttpError('Cound not find the blog'))
    }
    blog.views += 1
    try {
        await blog.save()
    } catch (err) {
        const error = new HttpError('Something went Wrong,cannot save', 500)
        return next(error)
    }
    let user
    let isbookmarked = false
    let isliked = false
    if(userid) {
        try{
            user = await User.findById(userid)
        } catch (err) {
            const error = new HttpError('this error', 500)
            return next(error)
        }
    }
    if(user) {
        isbookmarked = user.bookmarks.includes(blogId)
        isliked = user.liked.includes(blogId)       
    }
    let authorId = blog.authorId
    let author
    try{
        author = await User.findById(authorId)
    } catch (err) {
        const error = new HttpError('Something Went wrong,please try again', 500)
        return next(error)
    }
    if (!author || author.length === 0) {
        return next(new HttpError('Cound not find the blog'))
    }
    author.views += 1
    try {
        await author.save()
    } catch (err) {
        const error = new HttpError('Something went Wrong,cannot save', 500)
        return next(error)
    }
    res.json({ blog: blog.toObject({ getters: true }), isbookmarked:isbookmarked, isliked: isliked})
}

const fetchQueriedBlog = async (req, res, next) => {
    const query = req.params.query
    let blogs
    try {
        blogs = await Blog.find()
    } catch (err) {
        const error = new HttpError('Something Went wrong,please try again', 500)
        return next(error)
    }
    if (!blogs || blogs.length === 0) {
        return next(new HttpError('Cound not find any blogs'))
    }
    blogs.forEach(a => a.blog = undefined)
    let filteredblog = blogs.filter(blog => {
        if (blog.title.toLowerCase().includes(query.toLowerCase())) {
            return true;
        }
        return false;
    });
    res.status(200).json({ filteredblog: filteredblog.map(b => b.toObject({ getters: true })) })
}

exports.fetchAllBlogs = fetchAllBlogs
exports.fetchParticularBlog = fetchParticularBlog
exports.fetchQueriedBlog = fetchQueriedBlog

