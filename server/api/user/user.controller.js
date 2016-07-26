'use strict';

import User from './user.model';
import passport from 'passport';
import config from '../../config/environment';
import jwt from 'jsonwebtoken';
import _ from 'lodash';
import * as ut from '../../components/utils';
import Media from '../media/media.model';

function validationError(res, statusCode) {
  statusCode = statusCode || 422;
  return function(err) {
    res.status(statusCode).json(err);
  }
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function(err) {
    res.status(statusCode).send(err);
  };
}

function respondWith(res, statusCode) {
  statusCode = statusCode || 200;
  return function() {
    res.status(statusCode).end();
  };
}

/**
 * Get list of users
 * restriction: 'admin'
 */
exports.index = function(req, res) {
  User.findAsync({}, '-salt -hashedPassword')
    .then(function(users) {
      res.status(200).json(users);
    })
    .catch(handleError(res));
};

/**
 * Creates a new user
 */
exports.create = function(req, res, next) {
  var newUser = new User(req.body);
  newUser.provider = 'local';
  newUser.role = 'user';
  if (req.body.avatar) {
    Media.findOne({ _id: req.body.avatar }).lean().execAsync()
      .then((media) => {
        newUser.avatar = _.clone(media);
        newUser.saveAsync()
        .spread(function(user) {
          var token = jwt.sign({ _id: user._id }, config.secrets.session, {
            expiresInMinutes: 60 * 5
          });
          res.json({ token: token });
        }).catch(validationError(res));
      }).catch(handleError(res));
  } else {
    newUser.saveAsync().spread(function(user) {
      var token = jwt.sign({ _id: user._id }, config.secrets.session, {
        expiresInMinutes: 60 * 5
      });
      res.json({ token: token });
    }).catch(validationError(res));
  }
};

/**
 * Get a single user
 */
exports.show = function(req, res, next) {
  var userId = req.params.id;

  User.findById(userId)
    .populate('following', '-salt -hashedPassword')
    .execAsync()
    .then(function(user) {
      if (!user) {
        return res.status(404).end();
      }
      res.json(user.profile);
    })
    .catch(function(err) {
      return next(err);
    });
};

/**
 * Update my info
 */
export function update(req, res, next) {
  const userId = req.user._id;

  User.findOneAsync({ _id: userId }, '-salt -hashedPassword')
    .then(user => { // don't ever give out the password or salt
      if (!user) {
        res.status(404).end();
      }

      user = _.merge(user, {
        given_name: req.body.given_name,
        family_name: req.body.family_name,
        email: req.body.email,
        username: req.body.username
      });

      if (req.body.following) {
        if (!user.following) {
          user.following = [];
        }
        const i = user.following.map(f => f.toString()).indexOf(req.body.following);
        if (i > -1) {
          user.following.splice(i, 1);
        } else {
          user.following.unshift(req.body.following);
        }
      }

      if (req.body.avatar) {
        Media.findOne({ _id: req.body.avatar }).lean().execAsync()
        .then((media) => {
          user.avatar = _.clone(media);

          return user.saveAsync()
            .then(() => {
              User.findOneAsync({ _id: userId }, '-salt -hashedPassword')
              .then(updatedUser => res.json(updatedUser));
            })
            .catch(ut.validationError(req, res));
        });
      } else {
        return user.saveAsync()
          .then(() => {
            User.findOneAsync({ _id: userId }, '-salt -hashedPassword')
            .then(updatedUser => res.json(updatedUser));
          })
          .catch(ut.validationError(req, res));
      }
    })
    .catch(err => {
      console.log(err);
      next(err);
    });
}

/**
 * Deletes a user
 * restriction: 'admin'
 */
exports.destroy = function(req, res) {
  User.findByIdAndRemoveAsync(req.params.id)
    .then(function() {
      res.status(204).end();
    })
    .catch(handleError(res));
};

/**
 * Change a users password
 */
exports.changePassword = function(req, res, next) {
  var userId = req.user._id;
  var oldPass = String(req.body.oldPassword);
  var newPass = String(req.body.newPassword);

  User.findByIdAsync(userId)
    .then(function(user) {
      if (user.authenticate(oldPass)) {
        user.password = newPass;
        return user.saveAsync()
          .then(function() {
            res.status(204).end();
          })
          .catch(validationError(res));
      } else {
        return res.status(403).end();
      }
    });
};

/**
 * Get my info
 */
exports.me = function(req, res, next) {
  var userId = req.user._id;

  User.findOneAsync({ _id: userId }, '-salt -hashedPassword')
    .then(function(user) { // don't ever give out the password or salt
      if (!user) {
        return res.status(401).end();
      }
      res.json(user);
    })
    .catch(function(err) {
      return next(err);
    });
};

/**
 * Authentication callback
 */
exports.authCallback = function(req, res, next) {
  res.redirect('/');
};
