'use strict';

var express = require('express');
var controller = require('./post.controller');
import * as auth from '../../auth/auth.service';

var router = express.Router();

router.get('/', controller.index);
router.get('/mine', auth.isAuthenticated(), controller.mine);
router.get('/:id', controller.show);
router.post('/', auth.isAuthenticated(), controller.create);
router.post('/like/:id', auth.isAuthenticated(), controller.like);
router.put('/:id', controller.update);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);

module.exports = router;
