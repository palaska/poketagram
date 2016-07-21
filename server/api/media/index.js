'use strict';

var express = require('express');
var controller = require('./media.controller');
import * as auth from '../../auth/auth.service';
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

var router = express.Router();

router.get('/', controller.index);
router.get('/:id', controller.show);
router.post('/', upload.array('files', 20), controller.create);
router.put('/:id', controller.update);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);

module.exports = router;
