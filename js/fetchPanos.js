(function () {

var panosList = fetchPanos();

function fetchPanos() {
  return fetch('panos.json').then(function (response) {
    return response.json();
  });
}

self.panosList = panosList;

})();
