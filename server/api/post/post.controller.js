/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/posts              ->  index
 * POST    /api/posts              ->  create
 * GET     /api/posts/:id          ->  show
 * PUT     /api/posts/:id          ->  update
 * DELETE  /api/posts/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var Post = require('./post.model');
import * as ut from '../../components/utils';

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

// Gets a list of Posts
exports.index = function(req, res) {
  const q = ut.queryBuilder({ req, defaultCount: 20 });
  const sort = q.sort ? q.sort : '-created_at';
  Post.find(q.query)
    .sort(sort)
    .skip(q.skip)
    .limit(q.count)
    .populate('by')
    .populate('liked_by')
    .execAsync()
    .then(items => {
      Post.countAsync(q.query)
        .then(found =>
          res.status(200).send({ count: q.count, found, page: q.page, items })
        ).catch(handleError(res));
    }).catch(handleError(res));
};

// Gets a single Post from the DB
exports.show = function(req, res) {
  Post.findById(req.params.id)
    .populate('by')
    .populate('liked_by')
    .execAsync()
    .then(handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Gets a list of self posts DB
exports.mine = function(req, res) {
  const q = ut.queryBuilder({ req, defaultCount: 20 });
  const sort = q.sort ? q.sort : '-created_at';

  if (!q.query.$and) { q.query.$and = []; }
  q.query.$and.push({ by: req.user._id });

  Post.find(q.query)
    .sort(sort)
    .skip(q.skip)
    .limit(q.count)
    .populate('by')
    .populate('liked_by')
    .execAsync()
    .then(items => {
      Post.countAsync(q.query)
        .then(found =>
          res.status(200).send({ count: q.count, found, page: q.page, items })
        ).catch(handleError(res));
    })
    .catch(handleError(res));
};

// Gets posts of the people followed by a user
exports.following = function(req, res) {
  const q = ut.queryBuilder({ req, defaultCount: 20 });
  const sort = q.sort ? q.sort : '-created_at';

  if (!req.user.following) req.user.following = [];

  if (!q.query.$and) { q.query.$and = []; }
  q.query.$and.push({ by: { $in: req.user.following } });

  Post.find(q.query)
    .sort(sort)
    .skip(q.skip)
    .limit(q.count)
    .populate('by')
    .populate('liked_by')
    .execAsync()
    .then(items => {
      Post.countAsync(q.query)
        .then(found =>
          res.status(200).send({ count: q.count, found, page: q.page, items })
        ).catch(handleError(res));
    }).catch(handleError(res));
  
};

// Creates a new Post in the DB
exports.create = function(req, res) {
  let model = req.body;
  model.created_at = new Date();
  model.by = req.user._id;

  Post.createAsync(req.body)
    .then(responseWithResult(res, 201))
    .catch(handleError(res));
};

// Creates a new Post in the DB
exports.like = function(req, res) {
  const postId = req.params.id;

  Post.findByIdAsync(postId)
    .then(p => {
      if (!p.liked_by) p.liked_by = [];
      const strs = p.liked_by.map(u => `${u}`);
      const ii = strs.indexOf(`${req.user._id}`);
      if (ii > -1) {
        p.liked_by.splice(ii, 1);
      } else {
        p.liked_by.unshift(req.user._id);
      }

      p.saveAsync().spread(function(updated) {
        return updated;
      });
    })
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Updates an existing Post in the DB
exports.update = function(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Post.findByIdAsync(req.params.id)
    .then(handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Deletes a Post from the DB
exports.destroy = function(req, res) {
  Post.findByIdAsync(req.params.id)
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
};
