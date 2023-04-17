"use strict"
//  alert("내용부분 : " + this.lat + " / " + this.lon);

let _oldFetch = fetch;
let visible = true;
let userid = document.currentScript.dataset.userid;
// Create our new version of the fetch function
window.fetch = function () {

  // Create hooks
  let fetchStart = new Event('fetchStart', { 'view': document, 'bubbles': true, 'cancelable': false });
  let fetchEnd = new Event('fetchEnd', { 'view': document, 'bubbles': true, 'cancelable': false });

  // Pass the supplied arguments to the real fetch function
  let fetchCall = _oldFetch.apply(this, arguments);

  // Trigger the fetchStart event
  document.dispatchEvent(fetchStart);

  fetchCall.then(function () {
    // Trigger the fetchEnd event
    document.dispatchEvent(fetchEnd);
  }).catch(function () {
    // Trigger the fetchEnd event
    document.dispatchEvent(fetchEnd);
  });

  return fetchCall;
};

function startFatch() {
  if (userid === 'None') return;
  const loader = document.querySelector('.preload');
  const emoji = loader.querySelector('.emoji');
  loader.style.display = "block";

  const emojis = ["🕐", "🕜", "🕑", "🕝", "🕒", "🕞", "🕓", "🕟", "🕔", "🕠", "🕕", "🕡", "🕖", "🕢", "🕗", "🕣", "🕘", "🕤", "🕙", "🕥", "🕚", "🕦", "🕛", "🕧"];

  const loadEmojis = (arr) => {
    let inter = setInterval(() => {
      if (visible) {
        emoji.innerText = arr[Math.floor(Math.random() * arr.length)];
      } else {
        clearInterval(inter);
        document.querySelector('.preload').style.display = "none";
      }
      //console.log(Math.floor(Math.random() * arr.length))
    }, 500);
  }

  const init = () => {
    loadEmojis(emojis);
  }
  init();

  let btns = document.querySelectorAll(".btn");

  btns.forEach((btn) => {
    btn.disabled = true;
  });
}

function fetchEnd() {
  if (userid === 'None') return;

  visible = false;

  alert("경로가 검색되었습니다.");
};

// 전역변수 감추기
function init() {
  let map;
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

  function getMap() {
    return map;
  }

  function getResultMarkerArr() {
    return resultMarkerArr;
  }

  function getDrawInfoArr() {
    return drawInfoArr;
  }

  function getResultdrawArr() {
    return resultdrawArr;
  }

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

  return {
    getMap: getMap,
    getResultMarkerArr: getResultMarkerArr,
    getDrawInfoArr: getDrawInfoArr,
    getResultdrawArr: getResultdrawArr,
    resettingMap: resettingMap
  }
}

const app = init();

/** 길찾기 버튼 클릭 이벤트 
경로 그리기, 지도 업데이트
*/
const searchRouteButton = document.querySelector("#btn_select");
searchRouteButton.addEventListener('click', (event) => {
  app.resettingMap();

  let routeInfo;
  let busPath;
  let markers;

  let boundPoints;

  let routeInfoArr = [];

  startFatch();
  fetch("/getRoute")
    .then(response => response.text())
    .then((text) => {

      // 경로 그리기,마커 찍기, 지도 영역 설정
      try {
        routeInfo = JSON.parse(text);
      } catch (e) {
        window.location.href = text;
      }

      if (routeInfo.walking) {
        let busTime = routeInfo.bus.time.reduce((a, b) => a + b, 0);
        let busDistance = routeInfo.bus.distance.reduce((a, b) => a + b, 0);

        routeInfo.walking.time.splice(1, 0, busTime);
        routeInfo.walking.distance.splice(1, 0, busDistance);

        markers = JSON.parse(JSON.stringify(routeInfo.walking.points)); // 출발지-탑승지
        markers.splice(2, 0, ...routeInfo.bus.viaPoints); // 출발지 - 지나는 버스정류장 - 도착지

        let walkPath = routeInfo.walking.path;
        walkPath.forEach((path) => {
          drawRoute(path, "#ff0000");
        })

        busPath = routeInfo.bus.path;
        boundPoints = routeInfo.walking.points;

        // point, time, distance
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

      // 중복제거
      updateMap(busPath, markers, boundPoints);

      return routeInfoArr
    })
    .then((routeInfoArr) => {
      // 경로 인터페이스 생성
      createRouteInfoWindow(routeInfoArr[0], routeInfoArr[1], routeInfoArr[2])
    })
    .catch(console.log) // JSON데이터가 아닌 경우
    .finally(fetchEnd);
});

const { get, set } = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
const inputs = document.querySelectorAll(".form-control");

inputs.forEach((input) => {
  Object.defineProperty(input, 'value', {
    get() {
      return get.call(this);
    },
    set(newVal) {

      const options = {
        method: 'GET',
        headers: { accept: 'application/json', appKey: 'l7xx0540ab9b13084d30b44950c8a1b7f405' }
      };
      fetch('https://apis.openapi.sk.com/tmap/geo/fullAddrGeo?addressFlag=F00&version=1&fullAddr=' + newVal, options)
        .then(response => response.json())
        .then(response => response.coordinateInfo)
        .then((resultInfo) => {
          if (resultInfo?.coordinate) {
            let map = app.getMap();
            let coordinateInfo = resultInfo.coordinate[0]
            let markerPosition = new Tmapv2.LatLng(Number(coordinateInfo.newLat), Number(coordinateInfo.newLon));

            // 마커 올리기
            let marker = new Tmapv2.Marker(
              {
                position: markerPosition,
                icon: "http://tmapapi.sktelecom.com/upload/tmap/marker/pin_b_m_a.png",
                iconSize: new Tmapv2.Size(
                  24, 38),
                map: map
              });
            map.setCenter(markerPosition);
            map.setZoom(18);
            app.getResultMarkerArr().push(marker);
          }
        })
        .catch(err => console.error(err));
      return set.call(this, newVal);
    }
  });
})
/**
 * 매개변수를 바탕으로 지도를 업데이트하는 함수
 * @param {Array} path 좌표배열 
 * @param {Array} markers 마커좌표배열
 * @param {Array} points 지도영역위치
 */
function updateMap(path, markers, points) {
  drawRoute(path, "#229c9e");
  setMarker(markers);
  setMapBound(points);
}

/** 
 * 마커 찍기 함수 
 * @param {Array} points 좌표
*/
function setMarker(points) {
  let marker;
  const map = app.getMap();
  const resultMarkerArr = app.getResultMarkerArr();

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
  const map = app.getMap();
  const resultdrawArr = app.getResultdrawArr();

  path.forEach((coordinate) => {
    let latLng = new Tmapv2.LatLng(coordinate[1], coordinate[0]);
    drawInfoArr.push(latLng);
  });

  routeLine = new Tmapv2.Polyline({
    path: drawInfoArr,
    strokeColor: color,
    strokeWeight: 4,
    map: map
  });

  resultdrawArr.push(routeLine);
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

  const map = app.getMap();

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

/**
 * 경로의 정보(시간, 거리, 명칭)을 담고 있는 li 생성
 * @param {Array} pointArray 
 * @param {Array} timeArray 
 * @param {Array} distanceArray
 */
function createRouteInfoWindow(pointArray, timeArray, distanceArray) {
  let route_container = document.querySelector("#route_list");
  const map = app.getMap();
  // 기존 인터페이스 초기화
  if (route_container.childNodes) {
    route_container.innerHTML = '';
  }

  //forEach로 바꾸기
  for (let i = 0; i < pointArray.length; i++) {
    let route = document.createElement('li');
    let textDiv = document.createElement('div');

    route.setAttribute('class', 'route');
    route.dataset.lat = pointArray[i].lat;
    route.dataset.lon = pointArray[i].lon;

    textDiv.innerHTML = pointArray[i].name;
    route.appendChild(textDiv);

    if (i < pointArray.length - 1) {
      let time, distance;
      let childDiv = document.createElement('div');

      time = secToHHMMString(timeArray[i]);
      distance = mToKmString(distanceArray[i]);
      childDiv.innerHTML = time + " ↓ " + distance;

      route.appendChild(childDiv);
    } else {
      let totalTime = secToHHMMString(timeArray.reduce((a, b) => a + b, 0));
      let totalDistance = mToKmString(distanceArray.reduce((a, b) => a + b, 0));
      let totalTextNode = document.createTextNode("총 시간: " + totalTime + ", 총 거리: " + totalDistance);

      route_container.parentNode.appendChild(totalTextNode);
    }

    route.addEventListener('click', (event) => {
      let coord = new Tmapv2.LatLng(route.dataset.lat, route.dataset.lon);
      map.setCenter(coord);
      map.setZoom(15);
    });

    route_container.appendChild(route);
  }
}

/**
 * 인자로 전달된 초 단위의 시간을 분, 시간 단위로 변환한 문자열을 반환하는 함수
 * @param {number} sec 초
 * @returns {string} 분/시간 단위 문자열
*/
function secToHHMMString(sec) {
  let dateString = new Date(sec * 1000).toISOString().slice(11, 16);
  let hour = dateString.slice(0, 2);
  let min = dateString.slice(3);
  let timeString;

  if (min[0] == '0') {
    min = min[1];
  }

  if (hour == '00') {
    timeString = min + "분";
  } else {
    timeString = hour.slice(1) + "시간 " + min + "분";
  }

  return timeString;
}

/**
 * 인자로 전달된 미터 단위의 거리를 미터, 키로미터 다위로 변환한 문자열을 반환하는 함수
 * @param {number} sec 초
 * @returns {string} m/km 단위 문자열
*/
function mToKmString(m) {
  let km = m / 1000;
  let distanceString;
  if (km > 1) {
    distanceString = km.toFixed(1) + " km";
  } else {
    distanceString = m + " m";
  }

  return distanceString;
}

// initTamp();