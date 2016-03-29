var geolib = require('geolib');

function adjustLink(link, value) {
  var speed = link.totalLength/link.total_time;
  link.total_time += value/speed;
  link.totalLength += value;
}

module.exports = function(route, traking, cb) {
  var first_valid_link;
  for(var i in route.links) {
    var link = route.links[i];
    if (link.wpts==undefined || link.wpts.length==0) {
      continue;
    }
    if (!first_valid_link) {
      first_valid_link=i;
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
          link.start_delta += geolib.getDistance(line[0], [first_point.x, first_point.y], 1, 3);
          link.totalLength += geolib.getDistance([first_point.x, first_point.y], line[1], 1, 3);
          found_start = true;
          start_in_this_line=true;
        } else {
          link.start_delta += geolib.getDistance(line[0], line[1], 1, 3);
        }
      }
      if(found_start && !found_end) {
        if (geolib.isPointInLine([last_point.x,last_point.y], line[0], line[1])) {
          if (start_in_this_line) {
            link.totalLength -= geolib.getDistance([first_point.x,first_point.y], [last_point.x,last_point.y], 1, 3);
          } else {
            link.totalLength += geolib.getDistance(line[0], [last_point.x,last_point.y], 1, 3);
          }
          link.end_delta += geolib.getDistance([last_point.x,last_point.y], line[1], 1, 3);
          found_end = true;
          continue;
        } else {
          link.totalLength += geolib.getDistance(line[0], line[1], 1, 3);
        }
      } else {
        link.end_delta += geolib.getDistance(line[0], line[1], 1, 3);
      }
    }

    link.entry_time = first_point.timestamp;
    link.total_time = last_point.timestamp-first_point.timestamp;

    if (i>first_valid_link) {
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

      var last_time = previous_link.wpts[previous_link.wpts.length-1].timestamp;
      var total_time = link.wpts[0].timestamp-last_time;
      var time_left = total_time;

      var speed = total_length/total_time;

      for(var j in links_to_distribute) {
        var link_aux = links_to_distribute[j][0]
          , time_to_add = links_to_distribute[j][1]/speed
          ;

        link_aux.total_time += time_to_add;
        time_left -= time_to_add;

        link_aux.totalLength += links_to_distribute[j][1];
        var next_id = parseInt(j)+1;
        if (links_to_distribute[next_id] && links_to_distribute[next_id][0].entry_time==undefined) {
          links_to_distribute[next_id][0].entry_time = last_time-time_left;
        }
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
  cb.call(this, route);
}
