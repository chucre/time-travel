var fs = require('fs'),
    jade = require('jade'),
    http = require('http');

try {
  var dirStats = fs.statSync('cache');
} catch(e) {
  fs.mkdirSync('cache');
}
view = jade.compileFile('tracking.jade', {});

function parseResponse(data, tracking, cb) {
  var result = JSON.parse(data);
  for( var i=0;i<result.diary.entries.length;i++){
    entry = result.diary.entries[i];
    cb.call(this, entry, tracking);
  }
}
module.exports = function(tracking, cb) {
  var cache_file_name = './cache/mapmatching_'+tracking[0][0]+'_'+tracking[0][3]+'.json';
  fs.stat(cache_file_name, function(err, stats){
    if (err) {
      var gpxContent = view({tracks: tracking});
      var options = {
        method: 'POST',
        host: 'localhost',
        port: '8989',
        path: '/match?vehicle=car&max_nodes_to_visit=1000&force_repair=true&type=extended_json',
        headers: { 'Content-Type':'application/xml' }
      };
      var request = http.request(options, function(res) {
        res.setEncoding('utf8');
        var data = '';
        res.on('data', function (chunk) {
          data += chunk;
        });
        res.on('end', function() {
          var t = fs.writeFile(cache_file_name, data, function(err){
            if (err) {
              console.log("Error writing in : " + cache_file_name);
            } else {
              parseResponse(data, tracking, cb);
            }
          });
        });

        res.on('error', function(e){
          console.log("Got error on hit test.roadmatching.com: " + e.message);
        })
      });
      request.on('error', function(e){
        console.log("Got error on hit test.roadmatching.com: " + e.message);
      })
      request.write( gpxContent );
      request.end();
    } else {
      fs.readFile(cache_file_name, function(err, data){
        if (err) {
          console.log('Error on reading cache:'+cache_file_name);
          console.log(err.toString());
        } else {
          parseResponse(data, tracking, cb);
        }
      })
    }
  })

}
