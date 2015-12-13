var fs = require('fs');

module.exports = function(filename, cb) {
  buffer = fs.createReadStream(filename)
  var tracking = [];
  var last_track;
  var data = "";
  var returned = false;
  buffer.on('error', function(err) {
    console.log("error on read file: "+filename);
    console.log(err.toString());
  })
  buffer.on('data', function(_data){
    if (returned) return;
    data += _data;
    var indexOf = data.indexOf("\n");
    while (indexOf>=0) {
      var line = data.substring(0,indexOf).split(';');
      var track = [line[0],line[1],line[2],new Date(line[3]).getTime()];
      data = data.substring(indexOf+1, data.length);
      
      if (last_track && last_track[0]!=track[0]) {
        tracking.sort(function(a,b){
          return a[3]-b[3];
        })
        for(var i=1; i<tracking.length; i++) {
          if (tracking[i-1][1]==tracking[i][1] 
            && tracking[i-1][2]==tracking[i][2]
            && tracking[i-1][3]==tracking[i][3]) {
            tracking.splice(i, 1);
            i--;
          }
        }
        cb.call(this, tracking);
        returned=true;
        return;
        tracking = [];
        last_track=undefined;
      }
      tracking.push(track);
      last_track = track;
      indexOf = data.indexOf("\n");
    }
  })
}
