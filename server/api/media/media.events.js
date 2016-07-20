/**
 * Media model events
 */

'use strict';

var EventEmitter = require('events').EventEmitter;
var Media = require('./media.model');
var MediaEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
MediaEvents.setMaxListeners(0);

// Model events
var events = {
  'save': 'save',
  'remove': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  Media.schema.post(e, emitEvent(event));
}

function emitEvent(event) {
  return function(doc) {
    MediaEvents.emit(event + ':' + doc._id, doc);
    MediaEvents.emit(event, doc);
  }
}

module.exports = MediaEvents;
