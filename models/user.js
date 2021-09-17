const mongoose = require('mongoose') 
const uniqueValidator = require('mongoose-unique-validator')

const schema = mongoose.Schema

const userSchema = new schema({
    username: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true, minlength: 6},
    image: {type: String, required: true},
    profession: {type: String},
    bio: {type: String},
    views: {type: Number, required: true},
    bookmarks: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Blog' }],
    liked: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Blog' }],
    blogs: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Blog' }]
})

userSchema.plugin(uniqueValidator)

module.exports = mongoose.model('User',userSchema)