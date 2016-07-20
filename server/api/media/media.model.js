'use strict';

const mongoose = require('bluebird').promisifyAll(require('mongoose'));
const Schema = mongoose.Schema;
const config = require('../../config/environment');
// const ImgixClient = require('imgix-core-js');
//
// const client = new ImgixClient({
//   host: `${process.env.S3_MAIN_BUCKET}.imgix.net`,
//   secureURLToken: process.env.IMGIX_KEY
// });

const MediaSchema = new Schema({
  by: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  created_at: {
    type: Date,
    required: true
  },
  updated_at: Date,
  name: {
    type: String,
    required: true
  },
  orientation: Number
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

MediaSchema.virtual('url')
  .get(function () {
    const that = this;

    const addOrientation = () => {
      if (that.orientation && that.orientation !== 0) {
        return `?or=${that.orientation}`;
      }
      return '?';
    };

    const getFileExtension = (f) => f.substring(f.lastIndexOf('.') + 1);
    if (this.name) {
      if (config.validImageExtensions.indexOf(getFileExtension(this.name)) > -1) {
        return `https://${process.env.S3_MAIN_BUCKET}.imgix.net/${process.env.S3_BUCKET}/media/${this._id}/${this.name}${addOrientation()}`;
      }
      return `https://s3-eu-west-1.amazonaws.com/${process.env.S3_MAIN_BUCKET}/${process.env.S3_BUCKET}/media/${this._id}/${this.name}`;
    }
  });

module.exports = mongoose.model('Media', MediaSchema);
module.exports.schema = MediaSchema;
