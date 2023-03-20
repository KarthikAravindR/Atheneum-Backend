const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { OAuth2Client } = require('google-auth-library')
const fetch = require('node-fetch');

const HttpError = require('../models/http-error')
const User = require('../models/user');
const Blog = require('../models/blog');
const { response } = require('express');
const mongoose = require('mongoose');

const client = new OAuth2Client('162003935215-rp7i00q4jsf94gdg6afqdtmkbr1ohbmk.apps.googleusercontent.com')

const userSignup = async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return next(new HttpError('Field Cannot be empty', 422))
    }
    const { username, email, password, } = req.body
    let existingUser
    try {
        existingUser = await User.findOne({ email: email })
    } catch (err) {
        const error = new HttpError('Sign up failed,please try again', 500)
        return next(error)
    }
    if (existingUser) {
        const error = new HttpError('User Exists already, Please Log-In Instead', 422)
        return next(error)
    }
    let hashedPassword
    try {
        hashedPassword = await bcrypt.hash(password, 12)
    } catch (err) {
        const error = new HttpError('Could not sign-in the user, please try again', 500)
        return next(error)
    }
    const createdUser = new User({
        username,
        email,
        image: 'https://img.icons8.com/office/80/000000/test-account.png',
        password: hashedPassword,
        blogs: [],
        views: 0
    })
    try {
        await createdUser.save()
    } catch (err) {
        const error = new HttpError('Signing Up failed, please try again', 500)
        return next(error)
    }
    let token
    try {
        token = jwt.sign({ userId: createdUser.id, email: createdUser.email }, "super_secret_dont_share", {})
    } catch (err) {
        const error = new HttpError('Signing Up failed, please try again', 500)
        return next(error)
    }
    res.status(201).json({ userId: createdUser.id, username: createdUser.username, image: createdUser.image, token: token })
}

const userLogin = async (req, res, next) => {
    const { email, password } = req.body
    let existingUser
    try {
        existingUser = await User.findOne({ email: email })
    } catch (err) {
        const error = new HttpError('Sign up failed,please try again', 500)
        return next(error)
    }
    if (!existingUser) {
        return next(new HttpError('Invalid Credentials, could not log you in', 401))
    }
    let isValidPassword = false
    try {
        isValidPassword = await bcrypt.compare(password, existingUser.password)
    } catch (err) {
        const error = new HttpError('Could not log you In, please check your credentials and try again', 500)
    }
    if (!isValidPassword) {
        return next(new HttpError('Invalid Credentials, could not log you in', 401))
    }
    let token

    try {
        token = jwt.sign({ userId: existingUser.id, email: existingUser.email }, "super_secret_dont_share", {})
    } catch (err) {
        const error = new HttpError('Log In failed, please try again', 500)
        return next(error)
    }
    res.json({
        userId: existingUser.id,
        username: existingUser.username,
        image: existingUser.image,
        token: token,
    })
}

const googleLogin = (req, res, next) => {
    const { tokenId } = req.body
    client.verifyIdToken({ idToken: tokenId, audience: '162003935215-rp7i00q4jsf94gdg6afqdtmkbr1ohbmk.apps.googleusercontent.com' })
        .then(response => {
            const { email_verified, name, email, picture } = response.payload;
            if (email_verified) {
                User.findOne({ email }).exec((err, user) => {
                    if (err) {
                        const error = new HttpError('Could not sign-in the user, please try again', 500)
                        return next(error)
                    } else {
                        if (user) {
                            let token
                            try {
                                token = jwt.sign({ userId: user.id, email: user.email }, "super_secret_dont_share", {})
                            } catch (err) {
                                const error = new HttpError('Log In failed, please try again', 500)
                                return next(error)
                            }
                            res.json({ userId: user.id, username: user.username, image: user.image, token: token})
                        } else {
                            let password = 'socialmediapwd'
                            // let hashedPassword
                            // try {
                            //     hashedPassword = await bcrypt.hash(password, 12)
                            // } catch (err) {
                            //     const error = new HttpError('Could not sign-in the user, please try again', 500)
                            //     return next(error)
                            // }
                            // consol
                            // let hashedPassword
                            //     hashedPassword = bcrypt.hash(password, 12)
                            const createdUser = new User({
                                username: name,
                                email: email,
                                image: picture,
                                password: password,
                                blogs: [],
                                views: 0
                            })
                            try {
                                createdUser.save()
                            } catch (err) {
                                const error = new HttpError('Signing Up failed, please try again', 500)
                                return next(error)
                            }
                            let token
                            try {
                                token = jwt.sign({ userId: createdUser.id, email: createdUser.email }, "super_secret_dont_share", {})
                            } catch (err) {
                                const error = new HttpError('Signing Up failed, please try again', 500)
                                return next(error)
                            }
                            res.status(201).json({ userId: createdUser.id, username: createdUser.username, image: createdUser.image, token: token })
                        }
                    }
                })
            }
        })
}

const facebookLogin = (req, res, next) => {
    const { userId, accessToken } = req.body;
    let urlGraphFacebook = `https://graph.facebook.com/v2.11/${userId}/?fields=id,name,email&access_token=${accessToken}`
    fetch(urlGraphFacebook, {
        method: 'GET',
    })
        .then(response => response.json())
        .then(response => {
            const { email, name } = response
            User.findOne({ email }).exec((err, user) => {
                if (err) {
                    const error = new HttpError('Could not sign-in the user, please try again', 500)
                    return next(error)
                } else {
                    if (user) {
                        let token
                        try {
                            token = jwt.sign({ userId: user.id, email: user.email }, "super_secret_dont_share", {})
                        } catch (err) {
                            const error = new HttpError('Log In failed, please try again', 500)
                            return next(error)
                        }
                        res.json({ userId: user.id, username: user.username, image: user.image, token: token})
                    } else {
                        let password = 'socialmediapwd'
                        // let hashedPassword
                        // try {
                        //     hashedPassword = await bcrypt.hash(password, 12)
                        // } catch (err) {
                        //     const error = new HttpError('Could not sign-in the user, please try again', 500)
                        //     return next(error)
                        // }
                        // consol
                        // let hashedPassword
                        //     hashedPassword = bcrypt.hash(password, 12)
                        const createdUser = new User({
                            username: name,
                            email: email,
                            image: picture,
                            password: password,
                            blogs: [],
                            views: 0
                        })
                        try {
                            createdUser.save()
                        } catch (err) {
                            const error = new HttpError('Signing Up failed, please try again', 500)
                            return next(error)
                        }
                        let token
                        try {
                            token = jwt.sign({ userId: createdUser.id, email: createdUser.email }, "super_secret_dont_share", {})
                        } catch (err) {
                            const error = new HttpError('Signing Up failed, please try again', 500)
                            return next(error)
                        }
                        res.status(201).json({ userId: createdUser.id, username: createdUser.username, image: createdUser.image, token: token})
                    }
                }
            })
        })
}

const publishBlog = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(
            new HttpError('Invalid inputs passed, please check your data.', 422)
        );
    }

    const { authorId, username, image, dateposted, minread, blog, title, bannerimage } = req.body

    const createdBlog = new Blog({
        dateposted,
        minread,
        blog,
        authorname: username,
        authordp: image,
        authorId,
        title,
        bannerimage,
        views: 0,
        likes: 0,
    });
    let user;
    try {
        user = await User.findById(authorId);
    } catch (err) {
        const error = new HttpError(
            'Publishing the Blog failed, please try again.',
            500
        );
        return next(error);
    }

    if (!user) {
        const error = new HttpError('Could not find user for provided id.', 404);
        return next(error);
    }

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await createdBlog.save({ session: sess });
        user.blogs.push(createdBlog);
        await user.save({ session: sess });
        await sess.commitTransaction();
    } catch (err) {
        console.log(err)
        const error = new HttpError(
            'Publishing the Blog failed, please try again.',
            500
        );
        return next(error);
    }
    res.status(201).json({ blog: "success" });
}

const deleteUserBlog = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(
            new HttpError('Invalid inputs passed, please check your data.', 422)
        );
    }
    const { blogid, userid } = req.body
    let blog;
    try {
        blog = await Blog.findById(blogid).populate('authorId');
    } catch (err) {
        const error = new HttpError(
            'Something went wrong, could not delete blog.',
            500
        );
        return next(error);
    }
    if (!blog) {
        const error = new HttpError('Could not find place for this id.', 404);
        return next(error);
    }

    if (blog.authorId.id !== userid) {
        const error = new HttpError(
            'You are not allowed to delete this place.',
            401
        );
        return next(error);
    }
    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await blog.remove({ session: sess });
        blog.authorId.blogs.pull(blogid);
        await blog.authorId.save({ session: sess });
        await sess.commitTransaction();
    } catch (err) {
        const error = new HttpError(
            'Something went wrong, could not delete blog2.',
            500
        );
        return next(error);
    }
    res.status(200).json({ message: 'Deleted blog.' });
}

const updateProfession = async (req, res, next) => {
    const { profession, userid } = req.body
    let user
    try {
        user = await User.findById(userid)
    } catch (err) {
        const error = new HttpError('Something went Wrong', 500)
        return next(error)
    }
    if (!user) {
        return next(new HttpError('Cound not find the user', 404))
    }
    user.profession = profession
    try {
        await user.save()
    } catch (err) {
        const error = new HttpError('Something went Wrong,cannot save', 500)
        return next(error)
    }
    res.status(200).json({ user: user.toObject({ getters: true }) })

}

const updateBio = async (req, res, next) => {
    const { bio, userid } = req.body
    let user
    try {
        user = await User.findById(userid)
    } catch (err) {
        const error = new HttpError('Something went Wrong', 500)
        return next(error)
    }
    if (!user) {
        return next(new HttpError('Cound not find the user', 404))
    }
    user.bio = bio
    try {
        await user.save()
    } catch (err) {
        const error = new HttpError('Something went Wrong,cannot save', 500)
        return next(error)
    }
    res.status(200).json({ user: user.toObject({ getters: true }) })
}

const updateImage = async (req, res, next) => {
    const { image, userid } = req.body
    let user
    try {
        user = await User.findById(userid)
    } catch (err) {
        const error = new HttpError('Something went Wrong', 500)
        return next(error)
    }
    if (!user) {
        return next(new HttpError('Cound not find the user', 404))
    }
    user.image = image
    try {
        await user.save()
    } catch (err) {
        const error = new HttpError('Something went Wrong,cannot save', 500)
        return next(error)
    }
    res.status(200).json({ user: user.toObject({ getters: true }) })
}

const fetchUserAllInfo = async (req, res, next) => {
    const { id } = req.params.id
    let user
    try {
        user = await User.findById(req.params.id)
    } catch (err) {
        const error = new HttpError('process failed, please try again', 500)
        return next(error)
    }
    if (!user) {
        const error = new HttpError('User not Found', 500)
        return next(error)
    }
    let userBlogs = []
    for (let i = 0; i < user.blogs.length; i++) {
        let blog
        try {
            blog = await Blog.findById(user.blogs[i])
        } catch (err) {
            const error = new HttpError('Something Went wrong,please try again', 500)
            return next(error)
        }
        if (!blog || blog.length === 0) {
            continue
        }
        blog.blog = undefined
        userBlogs.push(blog)
    }
    res.status(201).json(
        {
            bio: user.bio,
            email: user.email,
            image: user.image,
            profession: user.profession,
            username: user.username,
            views: user.views,
            blogs: userBlogs,
            // liked: user.liked,
            // bookmarks: user.bookmarks,
        });
}

const addUserBookmark = async (req, res, next) => {
    const { userid, blogid } = req.body
    let user
    try {
        user = await User.findById(userid)
    } catch (err) {
        const error = new HttpError('Failed, Please Try again', 500)
        return next(error)
    }
    if (!user) {
        const error = new HttpError('User not Found!')
        return next(error)
    }
    user.bookmarks.push(blogid)
    try {
        await user.save()
    } catch (err) {
        const error = new HttpError('Something went Wrong,cannot save', 500)
        return next(error)
    }
    res.status(200).json({ message: "success" })
}

const addUserLike = async (req, res, next) => {
    const { userid, blogid } = req.body
    let user
    try {
        user = await User.findById(userid)
    } catch (err) {
        const error = new HttpError('Failed, Please Try again', 500)
        return next(error)
    }
    if (!user) {
        const error = new HttpError('User not Found!')
        return next(error)
    }
    user.liked.push(blogid)
    try {
        await user.save()
    } catch (err) {
        const error = new HttpError('Something went Wrong,cannot save', 500)
        return next(error)
    }
    let blog
    try{
        blog = await Blog.findById(blogid)
    } catch (err) {
        const error = new HttpError('Something Went wrong,please try again', 500)
        return next(error)
    }
    if (!blog || blog.length === 0) {
        return next(new HttpError('Cound not find the blog'))
    }
    blog.likes += 1
    try {
        await blog.save()
    } catch (err) {
        const error = new HttpError('Something went Wrong,cannot save', 500)
        return next(error)
    }
    res.status(200).json({ message: "success" })
}

const removeUserBookmark = async (req, res, next) => {
    const { userid, blogid } = req.body
    let user
    try {
        user = await User.findById(userid)
    } catch (err) {
        const error = new HttpError('Failed, Please Try again', 500)
        return next(error)
    }
    if (!user) {
        const error = new HttpError('User not Found!')
        return next(error)
    }
    let blog = user.bookmarks.indexOf(blogid)
    user.bookmarks.splice(blog, 1)
    try {
        await user.save()
    } catch (err) {
        const error = new HttpError('Something went Wrong,cannot save', 500)
        return next(error)
    }
    res.status(200).json({ message: "success" })
}

const removeUserLike = async (req, res, next) => {
    const { userid, blogid } = req.body
    let user
    try {
        user = await User.findById(userid)
    } catch (err) {
        const error = new HttpError('Failed, Please Try again', 500)
        return next(error)
    }
    if (!user) {
        const error = new HttpError('User not Found!')
        return next(error)
    }
    let blog = user.liked.indexOf(blogid)
    user.liked.splice(blog, 1)
    try {
        await user.save()
    } catch (err) {
        const error = new HttpError('Something went Wrong,cannot save', 500)
        return next(error)
    }
    let selectedblog
    try{
        selectedblog = await Blog.findById(blogid)
    } catch (err) {
        const error = new HttpError('Something Went wrong,please try again', 500)
        return next(error)
    }
    if (!selectedblog || selectedblog.length === 0) {
        return next(new HttpError('Cound not find the blog'))
    }
    selectedblog.likes -= 1
    try {
        await selectedblog.save()
    } catch (err) {
        const error = new HttpError('Something went Wrong,cannot save', 500)
        return next(error)
    }
    res.status(200).json({ message: "success" })
}

const fetchUserBookmark = async (req, res, next) => {
    const userid = req.params.userid
    let user
    try {
        user = await User.findById(userid)
    } catch (err) {
        const error = new HttpError('process failed, please try again', 500)
        return next(error)
    }
    if (!user) {
        const error = new HttpError('User not Found', 500)
        return next(error)
    }
    let userBookmarks = []
    for (let i = 0; i < user.bookmarks.length; i++) {
        let blog
        try {
            blog = await Blog.findById(user.bookmarks[i])
        } catch (err) {
            const error = new HttpError('Something Went wrong,please try again', 500)
            return next(error)
        }
        if (!blog || blog.length === 0) {
            continue
        }
        blog.blog = undefined
        userBookmarks.push(blog)
    }
    res.status(201).json({ userBookmarks: userBookmarks.map(b => b.toObject({ getters: true })) });
}

const fetchUserLike = async (req, res, next) => {
    const userid = req.params.userid
    let user
    try {
        user = await User.findById(userid)
    } catch (err) {
        const error = new HttpError('process failed, please try again', 500)
        return next(error)
    }
    if (!user) {
        const error = new HttpError('User not Found', 500)
        return next(error)
    }
    let userLikes = []
    for (let i = 0; i < user.liked.length; i++) {
        let blog
        try {
            blog = await Blog.findById(user.liked[i])
        } catch (err) {
            const error = new HttpError('Something Went wrong,please try again', 500)
            return next(error)
        }
        if (!blog || blog.length === 0) {
            continue
        }
        blog.blog = undefined
        userLikes.push(blog)
    }
    res.status(201).json({ userLikes: userLikes.map(b => b.toObject({ getters: true })) });
}


exports.userSignup = userSignup
exports.userLogin = userLogin
exports.googleLogin = googleLogin
exports.facebookLogin = facebookLogin
exports.publishBlog = publishBlog
exports.deleteUserBlog = deleteUserBlog
exports.updateProfession = updateProfession
exports.updateBio = updateBio
exports.updateImage = updateImage
exports.fetchUserAllInfo = fetchUserAllInfo
exports.addUserBookmark = addUserBookmark
exports.addUserLike = addUserLike
exports.removeUserBookmark = removeUserBookmark
exports.removeUserLike = removeUserLike
exports.fetchUserBookmark = fetchUserBookmark
exports.fetchUserLike = fetchUserLike
