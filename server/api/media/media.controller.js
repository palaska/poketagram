/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/medias              ->  index
 * POST    /api/medias              ->  create
 * GET     /api/medias/:id          ->  show
 * PUT     /api/medias/:id          ->  update
 * DELETE  /api/medias/:id          ->  destroy
 */

'use strict';

import _ from 'lodash';
import Media from './media.model';
const AWS = require('aws-sdk');
const fs = require('fs');
const config = require('../../config/environment');
import * as ut from '../../components/utils';

AWS.config.update({ region: 'eu-west-1' });
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function(err) {
    res.status(statusCode).send(err);
  };
}

function responseWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function(entity) {
    if (entity) {
      res.status(statusCode).json(entity);
    }
  };
}

function handleEntityNotFound(res) {
  return function(entity) {
    if (!entity) {
      res.status(404).end();
      return null;
    }
    return entity;
  };
}

function saveUpdates(updates) {
  return function(entity) {
    var updated = _.merge(entity, updates);
    return updated.saveAsync()
      .spread(function(updated) {
        return updated;
      });
  };
}

function removeEntity(res) {
  return function(entity) {
    if (entity) {
      return entity.removeAsync()
        .then(function() {
          res.status(204).end();
        });
    }
  };
}

const uploadFileAsync = (req, file, _id, cb) => {
  fs.readFile(file.path, (err, fileBuffer) => {
    const bucket = `${config.s3.bucket_full}/media/${_id}`;

    const params = {
      Bucket: bucket,
      Key: file.name,
      ContentType: file.mimetype,
      Body: fileBuffer
    };

    s3.putObject(params, (error, data) => {
      if (error) {
        return cb(null);
      }
      return cb(data);
    });
  });
};

// Gets a list of Medias
exports.index = function(req, res) {
  Media.findAsync()
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Gets a single Media from the DB
exports.show = function(req, res) {
  Media.findByIdAsync(req.params.id)
    .then(handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Creates a new Media in the DB
export function create(req, res) {
  // TODO beautify below hack
  const model = _.clone(req.files);
  const getFileExtension = (f) => f.substring(f.lastIndexOf('.') + 1);

  model.forEach((fileModel, i) => {
    const ext = getFileExtension(fileModel.originalname);
    model[i].created_at = new Date();
    model[i].by = (req.user && req.user._id) ? req.user._id : undefined;
    model[i].name = `${model[i].created_at.getTime()}.${ext}`;
    model[i] = _.pick(fileModel, ['created_at', 'by', 'name']);
    req.files[i].name = model[i].name;
  });

  Media.collection.insertAsync(model)
    .then((media) => {
      let cnt = 0;
      let successCnt = 0;
      req.files.map((file, i) => {
        uploadFileAsync(req, file, media.insertedIds[i], data => {
          // increment total response count from s3
          cnt++;
          if (data) {
            // increment total successful response count
            successCnt++;
            if (successCnt >= req.files.length) {
              media.obj = {};
              media.ops.forEach(o => {
                if (config.validImageExtensions.indexOf(getFileExtension(o.name)) > -1) {
                  o.url = `https://${process.env.S3_MAIN_BUCKET}.imgix.net/${process.env.S3_BUCKET}/media/${o._id}/${o.name}?`;
                } else {
                  o.url = `https://s3-eu-west-1.amazonaws.com/${process.env.S3_MAIN_BUCKET}/${process.env.S3_BUCKET}/media/${o._id}/${o.name}`;
                }
                media.obj[o.name] = o._id;
              });
              // only send successful response if s3 uploads are all successful
              return res.json(201, media);
            } else if (cnt === req.files.length) {
              res.send(400);
            }
          }
        });
      });
    }).catch(ut.handleError(req, res));
}

// Updates an existing Media in the DB
exports.update = function(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Media.findByIdAsync(req.params.id)
    .then(handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Deletes a Media from the DB
exports.destroy = function(req, res) {
  Media.findByIdAsync(req.params.id)
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
};
