var express = require('express');
var router = express.Router();

var tcontr = require('../src/controller/test.controller')

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/tes_res', function(req, res, next){
  tcontr.tarik_tes().then((v) => {
    res.send(v)
  })
});

router.post('/rdv', function(req, res, next){
  console.log(req);
  tcontr.getDisplayDateRange({start_date : `${req.body.start_date}`,end_date : `${req.body.end_date}`}).then((v) => {
    res.send(v)
  })
});

router.post('/batch_ir', function(req, res, next){
  console.log(req);
  tcontr.convertImgToDataURL({start_date : `${req.body.start_date}`,end_date : `${req.body.end_date}`}).then((v) => {
    res.send(v)
  })
}); 

router.get('/cek_json', function(req, res, next){
  console.log(req);
  tcontr.isiJson().then((v) => {
    res.send(v)
  })
});

module.exports = router;
