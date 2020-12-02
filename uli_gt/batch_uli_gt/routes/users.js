var express = require('express');
var router = express.Router();

var batch_cont = require('../src/controller/perfect_store_gt')

/* GET users listing. */
router.post('/loop_date', function(req, res, next) {
  batch_cont.loop_date({start_date : `${req.body.date_start}`,end_date : `${req.body.date_end}`}).then((v) => {
    res.send(v)
  })
});

router.post('/get_osa', function(req, res, next) {
  batch_cont.get_osa_pervisit({start_date : `${req.body.date_start}`,end_date : `${req.body.date_end}`}).then((v) => {
    res.send(v)
  })
});

module.exports = router;
