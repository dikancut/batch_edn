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

router.post('/get_edn', function(req, res, next){
  tcontr.getEdn().then((v) => {
    res.send(v)
  })
});

module.exports = router;
