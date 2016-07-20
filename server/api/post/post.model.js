'use strict';

var mongoose = require('bluebird').promisifyAll(require('mongoose'));
var Schema = mongoose.Schema;

var PostSchema = new Schema({
  text: String,
  image: {
  	ref: 'Media',
  	type: Schema.ObjectId
  },
  by: {
  	ref: 'User',
  	type: Schema.ObjectId
  },
  liked_by: [{
  	ref: 'User',
  	type: Schema.ObjectId
  }],
  created_at: Date
});

module.exports = mongoose.model('Post', PostSchema);
