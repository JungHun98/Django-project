"use strict"

let map;
let marker;
let markerIfo;
let login = false;
let resultMarkerArr = [];
let drawInfoArr = [];

/** 지도 페이지 초기화 함수 */
function initTamp() {
  try {
    map = new Tmapv2.Map("map_div", {
      center: new Tmapv2.LatLng(usrlat, usrlon),
      width: "100%",
      height: "80vh",
      zoom: 11,
      zoomControl: true,
      scrollwheel: true
    });
  } catch (error) {
    console.error("지도 띄우기", error);
  }
}

/** 길찾기 버튼 클릭 이벤트 */
const searchRouteButton = document.querySelector("#btn_select");
searchRouteButton.addEventListener('click', (event) => {
  let route_info;
  let bus_path;

  fetch("/getRoute")
    .then(response => response.text())
    .then((text) => {
      route_info = JSON.parse(text);
      login = true;
      console.log(route_info);

      if (route_info.walking) {
        let walkPath = route_info.walking.path
        bus_path = route_info.bus.path;

      }
      else {

      }


      /*
      중복 호출 제거
      setMarker
      drawRoute
      showPoint
      calCenter
      */
    })
    .catch((text) => window.location.href = text) // JSON데이터가 아닌 경우 로그인 page로 이동
    .finally();

});

/** 마커 찍기 함수 
 * @param {object} start
 * @param {object} end
 * @param {Array} viaPoint
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