'use strict';

import crypto from 'crypto';
import _ from 'lodash';
import config from '../../config/environment';
const bases = require('bases');

RegExp.quote = str => `${str}`.replace(/[.?*+^$[\]\\(){}|-]/g, '\\$&');

const logError = (req, err) => {
  let result = `Failed request: ${req.method} - ${req.originalUrl}\n`;
  result += `req.body: ${JSON.stringify(req.body)}\n`;
  result += `req.params: ${JSON.stringify(req.params)}\n`;
  result += `req.query: ${JSON.stringify(req.query)}\n`;
  result += `req.cookies: ${JSON.stringify(req.cookies)}\n`;
  result += err.stack;
  // logger.error(result);
  console.log(result);
};


// handle attributes
exports.embedAttributes = (obj) => {
  if (obj && !_.isEmpty(obj.attr)) {
    const attr = obj.attr;
    delete obj.attr;
    attr.forEach(a => {
      obj[a.k] = a.v;
    });
  }

  return obj;
};

exports.extractAttributes = (obj, type) => {
  // create attr field if not exists
  if (_.isEmpty(obj)) obj = {};
  if (_.isEmpty(obj.attr)) {
    obj.attr = [];
  }

  // iterate over attr array of strings and add the values to object
  config.attributes[type].forEach(a => {
    if (obj.hasOwnProperty(a)) {
      const o = { k: a, v: obj[a] };
      delete obj[a];
      obj.attr.push(o);
    }
  });

  return obj;
};

exports.hasRight = (role, min) => config.userRoles.indexOf(role) >= config.userRoles.indexOf(min);
exports.sanitizePhone = (pn) => `+${pn.replace(/ /g, '').replace(/\(/g, '').replace(/\)/g, '')}`;

exports.capitalizeFirstLetter = (str) => {
  const firstChar = str.charAt(0);
  if (firstChar === 'i') {
    return `İ${str.slice(1)}`;
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
};

exports.randomStr = (length) => {
  // We generate a random number in a space at least as big as 62^length,
  // and if it's too big, we just retry. This is still statistically O(1)
  // since repeated probabilities less than one converge to zero. Hat-tip to
  // a Google interview for teaching me this technique! ;)

  // The native randomBytes() returns an array of bytes, each of which is
  // effectively a base-256 integer. We derive the number of bytes to
  // generate based on that, but note that it can overflow after ~150:
  const maxNum = Math.pow(62, length);
  const numBytes = Math.ceil(Math.log(maxNum) / Math.log(256));

  if (numBytes === Infinity) {
    throw new Error(`Length too large; caused overflow: ${length}`);
  }

  let num = 0;
  do {
    num = 0;
    const bytes = crypto.randomBytes(numBytes);
    for (let i = 0; i < bytes.length; i++) {
      num += Math.pow(256, i) * bytes[i];
    }
  } while (num >= maxNum);

  return bases.toBase62(num);
};

exports.queryBuilder = function (opts) {
  const { req, defaultCount, model } = opts;
  const q = req.query;
  const sort = q.sort_by ? `-${q.sort_by}` : null;
  const count = parseInt(q.count, 10) || defaultCount;
  const page = q.page || 1;
  const skip = count * (page - 1);
  const query = { $and: [{ attr: { $all: [] } }] };
  let arr;
  const coords = {};

  if (q.count) { delete q.count; }
  if (q.page) { delete q.page; }
  if (q.locale) { delete q.locale; }
  if (q.sort_by) { delete q.sort_by; }

  for (const i in q) {
    if (q.hasOwnProperty(i)) {
      if (model && config.attributes[model].indexOf(i) > -1) {
        const ai = _.findIndex(query.$and, o => o.hasOwnProperty('attr'));
        if (_.isArray(q[i])) {
          const l = q[i].length;
          arr = [];
          for (let j = 0; j < l; j++) {
            const obj = { k: i, v: q[i][j] };
            arr.push(obj);
          }

          query.$and[ai].attr.$all.push({ $elemMatch: { $or: arr } });
        } else {
          query.$and[ai].attr.$all.push({ $elemMatch: { k: i, v: q[i] } });
        }
      } else if (i.includes('min')) {
        const p = i.split('min')[1].toLowerCase();
        if (p === 'price') {
          q[i] = q[i] * 100;
        }
        query[p] = { $gte: q[i] };
      } else if (i.includes('max')) {
        const p = i.split('max')[1].toLowerCase();
        if (p === 'price') {
          q[i] = q[i] * 100;
        }
        query[p] = { $lte: q[i] };
      } else if (i === 'ids') {
        query.$and.push({ _id: { $in: q[i] } });
      } else if (i === 'text') {
        arr = [];
        arr.push({ title: { $regex: new RegExp(`.*${RegExp.quote(q[i]).toLowerCase()}.*`, 'i') } });
        arr.push({ category: { $regex: new RegExp(`.*${RegExp.quote(q[i]).toLowerCase()}.*`, 'i') } });
        arr.push({ description: { $regex: new RegExp(`.*${RegExp.quote(q[i]).toLowerCase()}.*`, 'i') } });
        query.$and.push({ $or: arr });
      } else if (_.isArray(q[i])) {
        const l = q[i].length;
        arr = [];
        for (let j = 0; j < l; j++) {
          const obj = {};
          obj[i] = q[i][j];
          arr.push(obj);
        }

        query.$and.push({ $or: arr });
      } else if (i === 'name' || i === 'title') {
        query.$and.push({ [i]: { $regex: new RegExp(`^${RegExp.quote(q[i]).toLowerCase()}`, 'i') } });
      } else if (['north', 'south', 'west', 'east'].indexOf(i) > -1) {
        coords[i] = q[i];
      } else if (i === 'city' || i === 'district') {
        if (i === 'city') { // TODO
          query.$and.push({ 'address.administrative_areas': { $regex: new RegExp(`^${RegExp.quote(q[i]).toLowerCase()}`, 'i') } });
        } else {
          query.$and.push({ 'address.administrative_areas': { $regex: new RegExp(`^${RegExp.quote(q[i]).toLowerCase()}`, 'i') } });
        }
      } else {
        const obj = {};
        obj[i] = q[i];
        query.$and.push(obj);
      }
    }
  }

  if (coords.hasOwnProperty('north') && coords.north && coords.hasOwnProperty('south') && coords.south &&
  coords.hasOwnProperty('west') && coords.west && coords.hasOwnProperty('east') && coords.east) {
    const ci = _.findIndex(query.$and, o => o.hasOwnProperty('address.administrative_areas'));
    if (ci > -1) query.$and.splice(ci, 1);

    const di = _.findIndex(query.$and, o => o.hasOwnProperty('address.administrative_areas'));
    if (di > -1) query.$and.splice(di, 1);

    query.$and.push({ 'address.coords.lat': { $gt: coords.south } });
    query.$and.push({ 'address.coords.lat': { $lt: coords.north } });
    query.$and.push({ 'address.coords.lng': { $gt: coords.west } });
    query.$and.push({ 'address.coords.lng': { $lt: coords.east } });
  }

  const ai = _.findIndex(query.$and, o => o.hasOwnProperty('attr'));
  if (query.$and[ai].attr.$all.length === 0) {
    query.$and.splice(ai, 1);
  }


  if (query.$and.length === 0) {
    delete query.$and;
  }

  return { query, count, skip, page, sort };
};

exports.respondWithResult = function (res, statusCode) {
  statusCode = statusCode || 200;
  return entity => {
    if (entity) {
      res.status(statusCode).json(entity);
    }
  };
};

exports.saveUpdates = function (updates) {
  return entity => {
    if (entity) {
      _.forEach(updates, (val, key) => {
        if (_.isArray(val)) {
          if (key === 'attr') {
            if (!entity.attr) entity.attr = [];
            val.forEach(at => {
              const ai = _.findIndex(entity.attr, att => att.k === at.k);
              if (ai > -1) {
                entity.attr[ai].v = at.v;
              } else {
                entity.attr.push(at);
              }

              if (_.isArray(at.v)) {
                entity.markModified(`attr.${at.k}`);
              }
            });
          } else {
            entity[key] = updates[key];
          }

          delete updates[key];
          entity.markModified(key);
        }
      });

      const updated = _.merge(entity, updates);

      updated.updated_at = new Date();
      return updated.saveAsync()
      .spread(data => data);
    }
  };
};

exports.removeEntity = function (res) {
  return entity => {
    if (entity) {
      return entity.removeAsync()
        .then(() => {
          res.status(204).end();
        });
    }
  };
};

exports.handleEntityNotFound = function (res) {
  return entity => {
    if (!entity) {
      res.status(404).end();
      return null;
    }
    return entity;
  };
};

exports.validationError = function (req, res, statusCode) {
  statusCode = statusCode || 422;
  return err => {
    logError(req, err);
    res.status(statusCode).json(err);
  };
};


exports.handleError = function (req, res, statusCode) {
  statusCode = statusCode || 500;
  return err => {
    logError(req, err);
    res.status(statusCode).send(err);
  };
};
