const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const schema = mongoose.Schema

const blogSchema = new schema({
    authorId: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
    dateposted: {type: String, required: true},
    minread: {type: String, required: true},
    authorname: {type: String, required: true},
    authordp: {type: String, required: true},
    views: {type: Number, required: true},
    likes: {type: Number, required: true},
    title: {type: String, required: true},
    bannerimage: {type: String},
    blog: [{}]
})

blogSchema.plugin(uniqueValidator)

module.exports = mongoose.model('Blog', blogSchema)