'use strict';

var mongoose = require('bluebird').promisifyAll(require('mongoose'));
const MediaSchema = require('../media/media.model').schema;
var Schema = mongoose.Schema;

var PostSchema = new Schema({
  text: String,
  image: MediaSchema,
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
