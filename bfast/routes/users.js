var express = require('express');
var router = express.Router();

var tcontr = require('../src/controller/edn')

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/tes_res', function(req, res, next){
  tcontr.tarik_tes().then((v) => {
    res.send(v)
  })
});

router.post('/batch', function(req, res, next){
  // console.log(req.body.from);
  tcontr.getEdn({date_from : `${req.body.from}`,date_to : `${req.body.to}`}).then((v) => {
    res.send(v)
  })
});

module.exports = router;
