"use strict"

let map;
let marker;
let markerIfo;
let login = false;
let resultMarkerArr = [];
let drawInfoArr = [];
let resultdrawArr = [];

try {
  map = new Tmapv2.Map("map_div", {
    center: new Tmapv2.LatLng(37.49241689559544, 127.03171389453507),
    width: "100%",
    height: "80vh",
    zoom: 11,
    zoomControl: true,
    scrollwheel: true
  });
} catch (error) {
  console.error("지도 띄우기", error);
}


/* 길찾기 버튼 클릭 이벤트 */
const searchRouteButton = document.querySelector("#btn_select");
searchRouteButton.addEventListener('click', (event) => {
  let routeInfo;
  let busPath;
  let markers;

  let boundPoints;

  let routeInfoArr = [];

  fetch("/getRoute")
    .then(response => response.text())
    .then((text) => {
      // 경로 그리기,마커 찍기, 지도 영역 설정
      try{
        routeInfo = JSON.parse(text);
      } catch(e){
        window.location.href = text;
      }
      login = true;

      if (routeInfo.walking) {
        markers = JSON.parse(JSON.stringify(routeInfo.walking.points)); // 출발지-탑승지
        markers.splice(2, 0, ...routeInfo.bus.viaPoints); // 출발지 - 지나는 버스정류장 - 도착지

        let walkPath = routeInfo.walking.path;
        walkPath.forEach((path) => {
          drawRoute(path, "#ff0000");
        })

        busPath = routeInfo.bus.path;
        boundPoints = routeInfo.walking.points;

        routeInfoArr.push(routeInfo.walking.points);
        routeInfoArr.push(routeInfo.walking.time);
        routeInfoArr.push(routeInfo.walking.distance);
      }
      else {
        busPath = routeInfo.path;
        markers = routeInfo.viaPoints;
        boundPoints = routeInfo.viaPoints;

        routeInfoArr.push(routeInfo.viaPoints);
        routeInfoArr.push(routeInfo.time);
        routeInfoArr.push(routeInfo.distance);
      }

      console.log(routeInfo);

      drawRoute(busPath, "#229c9e");
      setMarker(markers);
      setMapBound(boundPoints);

      return routeInfoArr
    })
    .then(
      console.log
      // showPoint
      // 경로 인터페이스 출력
    )
    .catch(console.log) // JSON데이터가 아닌 경우
    .finally();
});

/** 
 * 마커 찍기 함수 
 * @param {Array} points 좌표
*/
function setMarker(points) {
  const busImg = "/MjAyMzAxMjVfMTAw/MDAxNjc0NjIwODkyNzIy.SbGS928H7yvR9ZRNvP_rqBJ2jiq_5IxnbvuKko7ckwkg.iddwW-EceWi528-cd2NgGlcTkqW_jqzNrUVNPFNKWKUg.PNG.keyhyun0123/image2vector.png?type=w580"
  const pinImg = "/MjAyMzAxMjVfNTcg/MDAxNjc0NjIzOTY3MTIz.bRdv0u15hKD0owBPoLETrLPlY8pfYC2t7pYNxMD0w5Mg.xSn1p05CUqANRlrzZBFc4QQiKrnMmxioIM0YdOt9_A8g.PNG.keyhyun0123/SE-72ea39b2-4a0d-4f7e-bae2-bb5a18a7c002.png?type=w580"

  points.forEach((point, idx) => {
    let iconImgURL = "https://postfiles.pstatic.net"

    if (idx == 0 || idx == points.length - 1) { //출발지, 도착지
      iconImgURL += pinImg;
    }
    else {
      iconImgURL += busImg
    }

    marker = new Tmapv2.Marker({
      position: new Tmapv2.LatLng(
        point.lat,
        point.lon),
      icon: iconImgURL,
      iconSize: new Tmapv2.Size(35, 35),
      title: point.name,
      map: map
    });

    resultMarkerArr.push(marker);
  });
}

/**
 * 경로를 전달한 색상으로 지도에 표시
 * @param {Array} path 경로
 * @param {string} color 색상
 */
function drawRoute(path, color) {
  let drawInfoArr = [];
  let routeLine;

  path.forEach((coordinate) => {
    let latLng = new Tmapv2.LatLng(coordinate[1], coordinate[0]);
    drawInfoArr.push(latLng);
  })

  routeLine = new Tmapv2.Polyline({
    path: drawInfoArr,
    strokeColor: color,
    strokeWeight: 4,
    map: map
  });

  resultdrawArr.push(routeLine);
  // 속도 개선 됨 왜???
  // 서버에서 fetch 속도가 그렇게 빨라진것은 아니다.
  // but 이전 버전에서는 polyLine 객체의 개수가 지나치게 많은 것이 원인이었던 것 같다.
  // 확인해 보니까 1600개의 인스턴스가 지도에 그려졌다;;;;
}

/** 
 * 지도의 범위를 매개변수로 전달된 GPS들을 기준으로 변경하는 함수
 * @param {Array} points GPS정보배열 
*/
function setMapBound(points) {
  let maxLatLon = { 'lat': 0, 'lon': 0 };
  let minLatLon = { 'lat': 50, 'lon': 150 };

  let centerLat;
  let centerLon;

  let boundX;
  let boundY;

  points.forEach((poi) => {
    if (maxLatLon.lat < poi.lat) {
      maxLatLon.lat = poi.lat;
    }
    if (maxLatLon.lon < poi.lon) {
      maxLatLon.lon = poi.lon;
    }
    if (minLatLon.lat > poi.lat) {
      minLatLon.lat = poi.lat;
    }
    if (minLatLon.lon > poi.lon) {
      minLatLon.lon = poi.lon;
    }
  });

  console.log(maxLatLon, minLatLon);
  centerLat = (maxLatLon.lat + minLatLon.lat) / 2.0;
  centerLon = (maxLatLon.lon + minLatLon.lon) / 2.0;

  boundX = (maxLatLon.lat - minLatLon.lat) / 2.0;
  boundY = (maxLatLon.lon - minLatLon.lon) / 2.0;

  let bounds = new Tmapv2.LatLngBounds();

  bounds.extend(new Tmapv2.LatLng(centerLat + boundX, centerLon));
  bounds.extend(new Tmapv2.LatLng(centerLat - boundX, centerLon));
  bounds.extend(new Tmapv2.LatLng(centerLat, centerLon + boundY));
  bounds.extend(new Tmapv2.LatLng(centerLat, centerLon - boundY));
  
  map.fitBounds(bounds, 70);
}
/** 지도에 표시된 기존 마커들과 경로를 clear하는 함수 */
function resettingMap() {

  if (resultMarkerArr.length > 0) {
    for (var i = 0; i < resultMarkerArr.length; i++) {
      resultMarkerArr[i].setMap(null);
    }
  }

  if (resultdrawArr.length > 0) {
    for (var i = 0; i < resultdrawArr.length; i++) {
      resultdrawArr[i].setMap(null);
    }
  }

  drawInfoArr = [];
  resultMarkerArr = [];
  resultdrawArr = [];
}

// initTamp();