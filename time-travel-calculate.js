var geolib = require('geolib');

function adjustLink(link, value) {
  var speed = link.totalLength/(link.total_time/1000);
  link_aux.total_time += value/speed;
  link_aux.totalLength += value;
}

module.exports = function(route, traking, cb) {
  for(var i in route.links) {
    var link = route.links[i];
    if (link.wpts==undefined || link.wpts.length==0) {
      continue;
    }
    var first_point = link.wpts[0];
    var last_point = link.wpts[link.wpts.length-1];
    
    link.totalLength = 0;
    link.start_delta = 0;
    link.end_delta = 0;
    
    var stringLine = JSON.parse(link.geometry);
    var found_start = found_end = false;
    for(var j=1; j<stringLine.coordinates.length; j++) {
      var line = [stringLine.coordinates[j-1], stringLine.coordinates[j]];
      var start_in_this_line = false;
      if (!found_start) {
        if (geolib.isPointInLine([first_point.x, first_point.y], line[0], line[1])) {
          link.start_delta += geolib.getDistance(line[0], [first_point.x, first_point.y]);
          link.totalLength += geolib.getDistance([first_point.x, first_point.y], line[1]);
          found_start = true;
          start_in_this_line=true;
        } else {
          link.start_delta += geolib.getDistance(line[0], line[1]);
        }
      }
      if(found_start && !found_end) {
        if (geolib.isPointInLine([last_point.x,last_point.y], line[0], line[1])) {
          if (start_in_this_line) {
            link.totalLength -= geolib.getDistance([first_point.x,first_point.y], [last_point.x,last_point.y]);
          } else {
            link.totalLength += geolib.getDistance(line[0], [last_point.x,last_point.y]);
          }
          link.end_delta += geolib.getDistance([last_point.x,last_point.y], line[1]);
          found_end = true;
          continue;
        } else {
          link.totalLength += geolib.getDistance(line[0], line[1]);
        }
      } else {
        link.end_delta += geolib.getDistance(line[0], line[1]);
      }
    }

    link.entry_time = traking[first_point.id][3];
    link.total_time = traking[last_point.id][3]-traking[first_point.id][3];
    
    if (i>0) {
      var j = i;
      
      var links_to_distribute = [[link, link.start_delta]];
      var previous_delta;
      var total_length = link.start_delta;
      var previous_link;
      do {
        j--;
        previous_link = route.links[j];
        if (previous_link.end_delta===undefined) {
          previous_delta = geolib.getPathLength(JSON.parse(previous_link.geometry).coordinates);
          previous_link.total_time=0;
          previous_link.totalLength = previous_delta;
        } else {
          previous_delta = previous_link.end_delta;
        }
        total_length += previous_delta;

        links_to_distribute.push([previous_link, previous_delta]);

      } while(previous_link.end_delta==undefined);
      

      var last_time = traking[previous_link.wpts[previous_link.wpts.length-1].id][3];
      var total_time = traking[link.wpts[0].id][3]-last_time;
      
      var speed = total_length/(total_time/1000);
      
      for(var j in links_to_distribute) {
        var link_aux = links_to_distribute[j][0];
        link_aux.total_time += links_to_distribute[j][1]/speed;
        link_aux.totalLength += links_to_distribute[j][1];
      }
    }
  }

  //ajusta o inicio
  adjustLink(route.links[0], route.links[0].start_delta);
  //ajusta o final
  if (route.links.length>=2) {
    var link = route.links[route.links.length-1];
    adjustLink(link, link.end_delta);
  }
  cp.call(this, route);
}
