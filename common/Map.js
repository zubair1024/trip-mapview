import React from "react";

export class Map extends React.Component {
  constructor() {
    super();
    this.historyEvents = [];
    this.map = {};
    this.mapData = [];
    this.tripsMapData = [];
    this.mapControl = {
      refreshInterval: 20000,
      autoRefresh: true,
      autoPan: true,
      autoZoom: false,
      autoCluster: true,
      connector: false
    };
    this.tripsMapControl = {
      refreshInterval: 20000,
      autoRefresh: true,
      autoPan: true,
      autoZoom: false,
      autoCluster: false,
      connector: true
    };
    this.currentInfoWindow = null;
    this.latlngBounds = null;
    this.markerCluster = null;
    this.markerClusterer = null;
    this.path = null;
    this.markers = null;
    this.tripsMarkers = null;
    this.tripsMarkerCluster = null;
    this.tripsMarkerClusterer = null;
    this.tripsLatlngBounds = null;
    this.tripsPath = null;
    this.tripsMap = null;
    this.currentTimeline = null;
    this.currentUser = {
      distance: "mi",
      speed: "mi/hr",
      pressure: "psi",
      volume: "l",
      temperature: "Celsius",
      timeFormat: "h:mm:ss a",
      dateFormat: "D/MM/YYYY",
      dateTimeFormat: "D/MM/YYYY h:mm:ss a",
      timezone: "Europe/London",
      imageUrl: "default.png"
    };
  }

  render() {
    return (
      <div>
        <div id="cd-google-map">
          <div id="google-container" />
          <div id="cd-zoom-in" />
          <div id="cd-zoom-out" />
        </div>
      </div>
    );
  }

  getPositions() {
    return new Promise(resolve => {
      $.ajax({
        url:
          "https://razrtrack.razrlab.com/kiko/map/history/5b1e82003dacb21138ca6bc2?start=2018-08-11T07:42:33.000Z&end=2018-08-11T08:24:07.000Z",
        success: res => {
          resolve(res);
        },
        error: error => {
          console.error(error);
          resolve(null);
        }
      });
    });
  }

  getRouteConnector(coordsString) {
    return new Promise((resolve, reject) => {
      $.ajax({
        url:`https://api.openrouteservice.org/directions?api_key=58d904a497c67e00015b45fc96f77eee2e244832a9614d43e6695c32&coordinates=${encodeURIComponent(
          coordsString
        )}&profile=driving-car&preference=shortest&format=json&units=m&language=en&geometry=true&geometry_format=polyline&geometry_simplify=&instructions=true&instructions_format=text&roundabout_exits=&attributes=&maneuvers=true&optimized=true`,
        success: (res)=>{
          resolve(res);
        },
        error:(err)=>{
          console.error(err);
          resolve(null)
        }
      })
    });
  }

  async deferred() {
    let responseData = await this.getPositions();
    if (responseData && responseData.data && responseData.data.length) {
      this.renderAssetMarker(() => {}, responseData, true, this.tripsMap);
    }
  }

  /**
   * Rendering Asset Markers on Map
   * @param {*} cb
   */
  renderAssetMarker(cb, res, history, map) {
    let me = this;

    if (map === me.map) {
      me.latlngBounds = new google.maps.LatLngBounds();

      if (me.markerCluster) {
        me.markerClusterer.clearMarkers();
      }
      if (me.path) {
        me.removePolygonConnector(me.path);
      }
      //clean up the markers
      me.removeMarkers(me.map, me.markers);
      //clean up the markers
      me.markers = [];
    } else {
      me.tripsLatlngBounds = new google.maps.LatLngBounds();
      if (me.tripsMarkerCluster) {
        me.tripsMarkerCluster.clearMarkers();
      }
      if (me.tripsPath) {
        me.removePolygonConnector(me.path);
      }
      //clean up the markers
      me.removeMarkers(me.tripsMap, me.tripsMarkers);
      //clean up the markers
      me.tripsMarkers = [];
    }

    //load all assets on map
    for (let i = 0; i < res.data.length; i++) {
      let markerInfo = res.data[i];
      let content;
      if (!history) {
        content = `
        <main>

        <input id="trip-tab1" type="radio" name="trip-tabs" checked>
        <label for="trip-tab1">Event Details</label>
    
        <input id="trip-tab2" type="radio" name="trip-tabs">
        <label for="trip-tab2">Asset Details</label>
    
        <section id="trip-content1">
            <table class="vehicleeventvalues">
                <tr>
                    <td>
                        <b>Event Type</b>
                    </td>
                    <td>${markerInfo.eventType}</td>
                </tr>
                <tr>
                    <td>
                        <b>Event Time</b>
                    </td>
                    <td>${this.formatDateTime(markerInfo.eventTime)}</td>
                </tr>
                <tr>
                    <td>
                        <b>Address</b>
                    </td>
                    <td>${markerInfo.reverseGeocoding || "-"}</td>
                </tr>
                <tr>
                    <td>
                        <b>Position</b>
                    </td>
                    <td>${markerInfo.latitude.toFixed(
                      5
                    )}, ${markerInfo.longitude.toFixed(5)}</td>
                </tr>
            </table>
        </section>
    
        <section id="trip-content2">
            <table  class="vehicleeventvalues">
                <tr>
                    <td width="60%">
                        <b>Engine Status</b>
                    </td>
                    <td>${(markerInfo._asset.features.engineStatus &&
                      markerInfo._asset.features.engineStatus.value) ||
                      "-"}</td>
                </tr>
                <tr>
                    <td width="60%">
                        <b>Speed</b>
                    </td>
                    <td>${(markerInfo.speedInMps &&
                      this.formatItem(
                        markerInfo.speedInMps,
                        "speed",
                        true
                      )) ||
                      "-"}</td>
                </tr>
                <tr>
                    <td width="60%">
                        <b>Coolant Temperature</b>
                    </td>
                    <td>${(markerInfo._asset.features
                      .engineCoolantTemperature &&
                      this.formatItem(
                        markerInfo._asset.features.engineCoolantTemperature
                          .value,
                        "temperature",
                        true
                      )) ||
                      "-"}</td>
                </tr>
                <tr>
                    <td width="60%">
                        <b>Fuel Level</b>
                    </td>
                    <td>${(markerInfo.currentFuelLevel &&
                      markerInfo.currentFuelLevel + " %") ||
                      "-"}</td>
                </tr>
            </table>
        </section>
    </main>
        `;
      } else {
        content = `
        <main>

        <input id="trip-tab1" type="radio" name="trip-tabs" checked>
        <label for="trip-tab1">Event Details</label>
        
        <input id="trip-tab2" type="radio" name="trip-tabs">
        <label for="trip-tab2">Asset Details</label>
        <section id="trip-content1">
            <table class="vehicleeventvalues">
                <tr>
                    <td>
                        <b>Event Type</b>
                    </td>
                    <td>${markerInfo.eventType}</td>
                </tr>
                <tr>
                    <td>
                        <b>Event Time</b>
                    </td>
                    <td>${this.formatDateTime(markerInfo.eventTime)}
                    </td>
                </tr>
                <tr>
                    <td>
                        <b>Address</b>
                    </td>
                    <td>${markerInfo.reverseGeocoding || "-"}</td>
                </tr>
                <tr>
                    <td>
                        <b>Position</b>
                    </td>
                    <td>${markerInfo.latitude.toFixed(
                      5
                    )}, ${markerInfo.longitude.toFixed(5)}</td>
                </tr>
            </table>
        </section>
        <section id="trip-content2">
            <table  class="vehicleeventvalues">
                <tr>
                    <td width="60%">
                        <b>Engine Status</b>
                    </td>
                    <td>${markerInfo.engineStatus || "-"}</td>
                </tr>
                <tr>
                    <td width="60%">
                        <b>Speed</b>
                    </td>
                    <td>${(markerInfo.speedInMps &&
                      this.formatItem(
                        markerInfo.speedInMps,
                        "speed",
                        true
                      )) ||
                      "-"}</td>
                </tr>
                <tr>
                    <td width="60%">
                        <b>Coolant Temperature</b>
                    </td>
                    <td>${(markerInfo.engineCoolantTemperature &&
                      this.formatItem(
                        markerInfo.engineCoolantTemperature,
                        "temperature",
                        true
                      )) ||
                      "-"}</td>
                </tr>
                <tr>
                    <td width="60%">
                        <b>Fuel Level</b>
                    </td>
                    <td>${(markerInfo.currentFuelLevel &&
                      markerInfo.currentFuelLevel + " %") ||
                      "-"}</td>
                </tr>
            </table>
        </section>
    </main>
        `;
      }
      let infowindow = new google.maps.InfoWindow({
        content: content
      });
      // asset map icon
      let iconColor;
      if (history) {
        iconColor = "#0277bd";

        if (markerInfo.harshDrivingType) {
          iconColor = "#f57f17";
        }

        if (markerInfo.tripFlag === "start") {
          iconColor = "#43a047";
        } else if (markerInfo.tripFlag === "end") {
          iconColor = "#e53935";
        }
      } else {
        iconColor = "#0277bd";
        if (markerInfo._asset && markerInfo._asset.features.engineStatus) {
          switch (markerInfo._asset.features.engineStatus.value) {
            case "on":
              iconColor = "#4dd0e1";
              break;

            case "off":
              iconColor = "#bdbdbd";
              break;

            default:
              //do nothing
              break;
          }
        }
      }

      //set heading
      let heading = markerInfo.heading
        ? parseFloat(markerInfo.heading + 180)
        : 0;

      let icon = {
        url: `data:image/svg+xml;utf-8, \
       <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
         viewBox="0 0 16 16" xml:space="preserve" transform="rotate(${heading})">
         <path fill="${iconColor}" class="path1" d="M8 2.1c1.1 0 2.2 0.5 3 1.3 0.8 0.9 1.3 1.9 1.3 3.1s-0.5 2.5-1.3 3.3l-3 3.1-3-3.1c-0.8-0.8-1.3-2-1.3-3.3 0-1.2 0.4-2.2 1.3-3.1 0.8-0.8 1.9-1.3 3-1.3z"></path>
         <path fill="#fff" class="path2" d="M8 15.8l-4.4-4.6c-1.2-1.2-1.9-2.9-1.9-4.7 0-1.7 0.6-3.2 1.8-4.5 1.3-1.2 2.8-1.8 4.5-1.8s3.2 0.7 4.4 1.9c1.2 1.2 1.8 2.8 1.8 4.5s-0.7 3.5-1.8 4.7l-4.4 4.5zM4 10.7l4 4.1 3.9-4.1c1-1.1 1.6-2.6 1.6-4.2 0-1.5-0.6-2.9-1.6-4s-2.4-1.7-3.9-1.7-2.9 0.6-4 1.7c-1 1.1-1.6 2.5-1.6 4 0 1.6 0.6 3.2 1.6 4.2v0z"></path>
         <path fill="#fff" class="path3" d="M8 16l-4.5-4.7c-1.2-1.2-1.9-3-1.9-4.8 0-1.7 0.6-3.3 1.9-4.6 1.2-1.2 2.8-1.9 4.5-1.9s3.3 0.7 4.5 1.9c1.2 1.3 1.9 2.9 1.9 4.6 0 1.8-0.7 3.6-1.9 4.8l-4.5 4.7zM8 0.3c-1.6 0-3.2 0.7-4.3 1.9-1.2 1.2-1.8 2.7-1.8 4.3 0 1.7 0.7 3.4 1.8 4.5l4.3 4.5 4.3-4.5c1.1-1.2 1.8-2.9 1.8-4.5s-0.6-3.1-1.8-4.4c-1.2-1.1-2.7-1.8-4.3-1.8zM8 15.1l-4.1-4.2c-1-1.2-1.7-2.8-1.7-4.4s0.6-3 1.7-4.1c1.1-1.1 2.6-1.7 4.1-1.7s3 0.6 4.1 1.7c1.1 1.1 1.7 2.6 1.7 4.1 0 1.6-0.6 3.2-1.7 4.3l-4.1 4.3zM4.2 10.6l3.8 4 3.8-4c1-1 1.6-2.6 1.6-4.1s-0.6-2.8-1.6-3.9c-1-1-2.4-1.6-3.8-1.6s-2.8 0.6-3.8 1.6c-1 1.1-1.6 2.4-1.6 3.9 0 1.6 0.6 3.1 1.6 4.1v0z"></path>
       </svg>`,
        anchor: new google.maps.Point(10, 20),
        scaledSize: new google.maps.Size(20, 20)
      };

      //create marker object
      let marker = new google.maps.Marker({
        position: {
          lat: parseFloat(markerInfo.latitude),
          lng: parseFloat(markerInfo.longitude)
        },
        title: markerInfo.assetName,
        icon: icon,
        map: map
      });

      //add listener for the map infoWindow click
      marker.addListener("click", function() {
        if (me.currentInfoWindow) {
          me.currentInfoWindow.close();
        }
        me.currentInfoWindow = infowindow;
        infowindow.open(me.map, marker);
      });

      google.maps.event.addListener(infowindow, "domready", function(e) {
        //intialize tabstrips.
        // $("#map-tabstrip").kendoTabStrip({
        //   animation: {
        //     open: {
        //       effects: "fadeIn"
        //     }
        //   }
        // });
        // Reference to the DIV which receives the contents of the infowindow using jQuery
        let iwOuter = $(".gm-style-iw");
        let iwBackground = iwOuter.prev();
        // Remove the background shadow DIV
        iwBackground.children(":nth-child(2)").css({ display: "none" });
        // Remove the white background DIV
        iwBackground.children(":nth-child(4)").css({ display: "none" });
        // Reference to the div that groups the close button elements.
        var iwCloseBtn = iwOuter.next();

        // Apply the desired effect to the close button
        iwCloseBtn.css({
          opacity: "1",
          right: "15px",
          top: "5px",
          width: "20px",
          height: "20px",
          border: "3px solid red",
          "border-radius": "13px",
          "box-shadow": "0 0 2px red"
        });
      });

      if (map === me.map) {
        //push the marker to class
        me.markers.push(marker);

        //extend bounds
        me.latlngBounds.extend({
          lat: parseFloat(markerInfo.latitude),
          lng: parseFloat(markerInfo.longitude)
        });
      } else {
        //push the marker to class
        me.tripsMarkers.push(marker);

        //extend bounds
        me.tripsLatlngBounds.extend({
          lat: parseFloat(markerInfo.latitude),
          lng: parseFloat(markerInfo.longitude)
        });
      }
    }

    if (map === me.map) {
      //auto pan if option is selected
      if (me.mapControl.autoPan) {
        me.autoPan(me.map, me.latlngBounds, me.markers);
      }

      //add clustering
      if (me.mapControl.autoCluster) {
        me.addClusters(me.map, me.markerClusterer, me.markers);
      }

      //add clustering
      if (me.mapControl.connector) {
        me.addPloygonConnector(me.map, me.markers, me.tripsPath);
      }
    } else {
      //auto pan if option is selected
      if (me.tripsMapControl.autoPan) {
        me.autoPan(me.tripsMap, me.tripsLatlngBounds, me.tripsMarkers);
      }

      //add clustering
      if (me.tripsMapControl.autoCluster) {
        me.addClusters(me.tripsMap, me.tripsMarkerClusterer, me.tripsMarkers);
      }

      //add clustering
      if (me.tripsMapControl.connector) {
        me.addPloygonConnector(me.tripsMap, me.tripsMarkers, me.tripsPath);
      }
    }
    //return
    cb && cb();
  }

  /**
   * Remove Asset Markers
   */
  removeMarkers(map, markers) {
    if (markers && markers.length) {
      for (let i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
      }
      if (map === this.map) {
        this.markers = [];
      } else {
        this.tripsMarkers = [];
      }
    }
  }

  /**
   * Auto Pan Map to Markers
   */
  autoPan(map, latlngBounds, markers) {
    let len = markers.length;
    for (let i = 0; i < len; i++) {
      //extend bounds
      markers[i].map && latlngBounds.extend(markers[i].position);
    }

    // Don't zoom in too far on only one marker
    if (latlngBounds.getNorthEast().equals(latlngBounds.getSouthWest())) {
      var extendPoint1 = new google.maps.LatLng(
        latlngBounds.getNorthEast().lat() + 0.01,
        latlngBounds.getNorthEast().lng() + 0.01
      );
      var extendPoint2 = new google.maps.LatLng(
        latlngBounds.getNorthEast().lat() - 0.01,
        latlngBounds.getNorthEast().lng() - 0.01
      );
      latlngBounds.extend(extendPoint1);
      latlngBounds.extend(extendPoint2);
    }

    //now fit the map to the newly inclusive bounds
    map.fitBounds(latlngBounds);
  }

  /**
   * Adding clustering
   */
  addClusters(map, markerClusterer, markers) {
    if (markerClusterer) {
      markerClusterer.clearMarkers();
    }
    let newMarkerClusterer = new MarkerClusterer(map, markers, {
      imagePath:
        "https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m"
    });

    if (map === this.map) {
      this.markerClusterer = newMarkerClusterer;
    } else {
      this.tripsMarkerClusterer = newMarkerClusterer;
    }
  }

  /**
   * Remove marker clustering
   */
  removeCluster(map, markerClusterer) {
    markerClusterer.clearMarkers();
    if (map === this.map) {
      if (!this.currentTimeline) {
        this.renderAssetMarker(() => {}, this.mapData, true, map);
      } else {
        this.renderAssetMarker(() => {}, this.mapData, false, map);
      }
    } else {
      this.renderAssetMarker(() => {}, this.tripsMapData, true, map);
    }
  }

  /**
   * Toggle Clusterer
   * @param e Event Element
   */
  toggleClusterer(e) {
    if (e.srcElement.checked) {
      this.addClusters(this.map, this.markerCluster, this.markers);
    } else {
      this.removeCluster(this.map, this.markerClusterer);
    }
  }

  /**
   * Toggle Clusterer
   * @param e Event Element
   */
  togglePolygon(e) {
    if (e.srcElement.checked) {
      this.addPloygonConnector(this.map, this.markers, this.path);
    } else {
      this.removePolygonConnector(this.path);
    }
  }

  /**
   * Toggle Clusterer
   * @param e Event Element
   */
  toggleTripsClusterer(e) {
    if (e.srcElement.checked) {
      this.addClusters(
        this.tripsMap,
        this.tripsMarkerCluster,
        this.tripsMarkers
      );
    } else {
      this.removeCluster(this.tripsMap, this.tripsMarkerClusterer);
    }
  }

  /**
   * Toggle Clusterer
   * @param e Event Element
   */
  toggleTripsPolygon(e) {
    if (e.srcElement.checked) {
      this.addPloygonConnector(
        this.tripsMap,
        this.tripsMarkers,
        this.tripsPath
      );
    } else {
      this.removePolygonConnector(this.tripsPath);
    }
  }

  /**
   * Add Ploygon connectors for the asset markers
   */
  async addPloygonConnector(map, markers, path) {
    let me = this;
    if (path) {
      path.setMap(null);
    }
    let totalLinePath = [];
    let chunks = this.chunkArray(markers, 50);
    // let chunksLength = chunks.length;

    let routeApiRequests = [];

    for (let i = 0; i < chunks.length; i++) {
      let temparray = chunks[i];
      let coordsString = "";
      let bearingsAndDeviationString = "";

      for (let k = 0; k < temparray.length; k++) {
        coordsString += `${temparray[k].getPosition().lng()},${temparray[k]
          .getPosition()
          .lat()}|`;
        bearingsAndDeviationString += `${temparray[k].heading},0|`;
      }
      //Array of promises
      routeApiRequests.push(this.getRouteConnector(coordsString));
    }

    //Ensure that even if one of the promises fails, the other successful ones don't get ignored
    const settleAll = ps => Promise.all(ps.map(p => p.catch(_ => {})));
    await settleAll(routeApiRequests)
      .then((responses) => {
        responses.map(res => {
          if (res && res.routes && res.routes[0].geometry) {
            let linePath = res.routes[0].geometry.map(pos => {
              return {
                lat: pos[1],
                lng: pos[0]
              };
            });

            //clean up data
            linePath = linePath.filter(item => {
              return item.lat;
            });
            totalLinePath = [...totalLinePath, ...linePath];
          }
        });
      })
      .catch(error => {
        console.log(error);
      });

    //remove the first element
    totalLinePath.shift();
    //create the path
    let newPath = new google.maps.Polyline({
      path: totalLinePath,
      strokeColor: "#FF0000",
      strokeOpacity: 1.0,
      strokeWeight: 2
    });

    if (map === me.map) {
      me.path = newPath;
      me.path.setMap(map);
    } else {
      me.tripsPath = newPath;
      me.tripsPath.setMap(map);
    }
  }

  /**
   * Remove Polygon Connectors for the asset markers
   */
  removePolygonConnector(path) {
    if (path) {
      path.setMap(null);
    }
  }

  renderAssetMarkers(data) {
    console.log(data);
    console.log(this.mapControl);
  }

  componentDidMount() {
    console.log("componentDidMount");

    this.deferred();

    // jQuery(document).ready(function($){
    //set your google maps parameters
    var $latitude = 25,
      $longitude = 55,
      $map_zoom = 14;

    //google map custom marker icon - .png fallback for IE11
    var is_internetExplorer11 =
      navigator.userAgent.toLowerCase().indexOf("trident") > -1;
    var $marker_url = is_internetExplorer11
      ? "https://s3-us-west-2.amazonaws.com/s.cdpn.io/148866/cd-icon-location.png"
      : "https://s3-us-west-2.amazonaws.com/s.cdpn.io/148866/cd-icon-location_1.svg";

    //define the basic color of your map, plus a value for saturation and brightness
    var $main_color = "#2d313f",
      $saturation = -20,
      $brightness = 5;

    //we define here the style of the map
    var style = [
      {
        //set saturation for the labels on the map
        elementType: "labels",
        stylers: [{ saturation: $saturation }]
      },
      {
        //poi stands for point of interest - don't show these lables on the map
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }]
      },
      {
        //don't show highways lables on the map
        featureType: "road.highway",
        elementType: "labels",
        stylers: [{ visibility: "off" }]
      },
      {
        //don't show local road lables on the map
        featureType: "road.local",
        elementType: "labels.icon",
        stylers: [{ visibility: "off" }]
      },
      {
        //don't show arterial road lables on the map
        featureType: "road.arterial",
        elementType: "labels.icon",
        stylers: [{ visibility: "off" }]
      },
      {
        //don't show road lables on the map
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [{ visibility: "off" }]
      },
      //style different elements on the map
      {
        featureType: "transit",
        elementType: "geometry.fill",
        stylers: [
          { hue: $main_color },
          { visibility: "on" },
          { lightness: $brightness },
          { saturation: $saturation }
        ]
      },
      {
        featureType: "poi",
        elementType: "geometry.fill",
        stylers: [
          { hue: $main_color },
          { visibility: "on" },
          { lightness: $brightness },
          { saturation: $saturation }
        ]
      },
      {
        featureType: "poi.government",
        elementType: "geometry.fill",
        stylers: [
          { hue: $main_color },
          { visibility: "on" },
          { lightness: $brightness },
          { saturation: $saturation }
        ]
      },
      {
        featureType: "poi.sport_complex",
        elementType: "geometry.fill",
        stylers: [
          { hue: $main_color },
          { visibility: "on" },
          { lightness: $brightness },
          { saturation: $saturation }
        ]
      },
      {
        featureType: "poi.attraction",
        elementType: "geometry.fill",
        stylers: [
          { hue: $main_color },
          { visibility: "on" },
          { lightness: $brightness },
          { saturation: $saturation }
        ]
      },
      {
        featureType: "poi.business",
        elementType: "geometry.fill",
        stylers: [
          { hue: $main_color },
          { visibility: "on" },
          { lightness: $brightness },
          { saturation: $saturation }
        ]
      },
      {
        featureType: "transit",
        elementType: "geometry.fill",
        stylers: [
          { hue: $main_color },
          { visibility: "on" },
          { lightness: $brightness },
          { saturation: $saturation }
        ]
      },
      {
        featureType: "transit.station",
        elementType: "geometry.fill",
        stylers: [
          { hue: $main_color },
          { visibility: "on" },
          { lightness: $brightness },
          { saturation: $saturation }
        ]
      },
      {
        featureType: "landscape",
        stylers: [
          { hue: $main_color },
          { visibility: "on" },
          { lightness: $brightness },
          { saturation: $saturation }
        ]
      },
      {
        featureType: "road",
        elementType: "geometry.fill",
        stylers: [
          { hue: $main_color },
          { visibility: "on" },
          { lightness: $brightness },
          { saturation: $saturation }
        ]
      },
      {
        featureType: "road.highway",
        elementType: "geometry.fill",
        stylers: [
          { hue: $main_color },
          { visibility: "on" },
          { lightness: $brightness },
          { saturation: $saturation }
        ]
      },
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [
          { hue: $main_color },
          { visibility: "on" },
          { lightness: $brightness },
          { saturation: $saturation }
        ]
      }
    ];

    //set google map options
    var map_options = {
      center: new google.maps.LatLng($latitude, $longitude),
      zoom: $map_zoom,
      panControl: true,
      zoomControl: true,
      mapTypeControl: true,
      streetViewControl: true,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      scrollwheel: true,
      styles: style
    };
    //inizialize the map
    this.tripsMap = new google.maps.Map(
      document.getElementById("google-container"),
      map_options
    );
    //add a custom marker to the map
    // var marker = new google.maps.Marker({
    //   position: new google.maps.LatLng($latitude, $longitude),
    //   map: this.tripsMap,
    //   visible: true,
    //   icon: $marker_url
    // });

    //add custom buttons for the zoom-in/zoom-out on the map
    function CustomZoomControl(controlDiv, map) {
      //grap the zoom elements from the DOM and insert them in the map
      var controlUIzoomIn = document.getElementById("cd-zoom-in"),
        controlUIzoomOut = document.getElementById("cd-zoom-out");
      controlDiv.appendChild(controlUIzoomIn);
      controlDiv.appendChild(controlUIzoomOut);

      // Setup the click event listeners and zoom-in or out according to the clicked element
      google.maps.event.addDomListener(controlUIzoomIn, "click", function() {
        map.setZoom(this.tripsMap.getZoom() + 1);
      });
      google.maps.event.addDomListener(controlUIzoomOut, "click", function() {
        map.setZoom(this.tripsMap.getZoom() - 1);
      });
    }

    var zoomControlDiv = document.createElement("div");
    var zoomControl = new CustomZoomControl(zoomControlDiv, this.tripsMap);

    //insert the zoom div on the top left of the map
    this.tripsMap.controls[google.maps.ControlPosition.LEFT_TOP].push(
      zoomControlDiv
    );
    // });
  }

  componentWillUnmount() {
    console.log("componentWillUnmount");
  }

  getStatistics() {
    console.log("getStatistics");
    $.ajax({
      url:
        "https://carlo.razrlab.com/kiko/asset/statistics/5b6c9225fdb5352c9a33a417?start=2018-08-10T19:53:50.000Z&end=2018-08-10T20:30:41.000Z",
      success: res => {
        console.log(res);
      },
      error: err => {
        console.log(err);
      }
    });
  }

  formatItem(value, unitType, suffixFlag) {
    let factor = 1;
    let offset = 0;
    let suffix;
    switch (unitType) {
      case "distance":
        switch (this.currentUser.distance) {
          case "mi":
            // 1 (international) Mile = 1609.344 meters
            factor = factor * 0.621371192;
            suffix = this.translate(" mi");
            break;
          default:
            //km
            suffix = this.translate(" km");
        }
        break;
      case "speed":
        //m/s to km/hr
        factor = 3.6;
        switch (this.currentUser.speed) {
          case "mi/hr":
            // 1 (international) Mile = 1609.344 meters
            factor = factor * 0.62;
            suffix = this.translate(" mi/hr");
            break;
          default:
            suffix = this.translate(" km/hr");
        }
        break;
      case "temperature":
        switch (this.currentUser.temperature) {
          case "Fahrenheit":
            // Fahrenheit = Celsius x 1,8 + 32
            factor = 1.8;
            offset = 32;
            suffix = this.translate(" °F");
            break;
          default:
            suffix = this.translate(" °C");
        }
        break;
      case "volume":
        switch (this.currentUser.volume) {
          case "gal":
            // 1 (US.liq.gal.) Gallon = 3.785411784 liters
            factor = 0.26417205235815;
            suffix = this.translate(" gal");
            break;
          default:
            suffix = this.translate(" l");
        }
        break;
      case "volume/time":
        switch (this.currentUser.volume) {
          case "gal":
            // 1 (US.liq.gal.) Gallon = 3.785411784 liters
            factor = 0.26417205235815;
            suffix = this.translate(" gal/hr");
            break;
          default:
            suffix = this.translate(" l/hr");
        }
        break;
      case "pressure":
        switch (this.currentUser.pressure) {
          case "bar":
            // 1 psi = 0.06895 bar
            factor = 0.06895;
            suffix = this.translate(" bar");
            break;
          default:
            suffix = this.translate(" psi");
        }
        break;
      default:
      // Do nothing.
    }
    //Implicitly returns undefined if value is invalid
    if ($.isNumeric(value)) {
      value = value * factor + offset;
      //if decimal
      if (value % 1 !== 0) {
        value = value.toFixed(2);
      }
      return suffixFlag ? value + suffix : value;
    }
  }

  formatDateTime(value) {
    if (value !== null && value !== "") {
      if (value instanceof Date) {
        value = value.toISOString();
      }
      let formatValue =
        this.currentUser.dateTimeFormat || "D/MM/YYYY h:mm:ss a";
      let timezone = this.currentUser.timezone || "Europe/London";
      if (!value.tz) {
        value = moment(value);
      }
      //return converted value
      return value.tz(timezone).format(formatValue);
    } else {
      //return blank
      return "-";
    }
  }

  chunkArray(myArray, chuckSize) {
    let index = 0;
    let arrayLength = myArray.length;
    let tempArray = [];

    for (index = 0; index < arrayLength; index += chuckSize) {
      let myChunk = myArray.slice(index, index + chuckSize);
      // Do something if you want with the group
      tempArray.push(myChunk);
    }

    return tempArray;
  }

  translate(value) {
    return value;
  }

  capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}
