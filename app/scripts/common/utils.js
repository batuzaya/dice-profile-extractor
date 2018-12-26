var getFileBlob = function(url, cb) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url);
  xhr.responseType = 'blob';
  xhr.addEventListener('load', function() {
    cb(xhr.response);
  });
  xhr.send();
};

var blobToFile = function(blob, name) {
  blob.lastModifiedDate = new Date();
  blob.name = name;
  return new File([blob], name);
};

var getFileObject = function(filePathOrUrl, filename, cb) {
  getFileBlob(filePathOrUrl, function(blob) {
    cb(blobToFile(blob, filename));
  });
};

var fnUploadFile = function(data, file, onsuccess, onerror) {
  var fd = new FormData();

  fd.append('data', JSON.stringify(data));
  fd.append('file', file);

  console.log('file', file);

  var options = {
    type: 'POST',
    data: fd,
    dataType: 'json',
    cache: false,
    processData: false,
    contentType: false,
  };

  if (App.credentials)
    options.headers = {
      'Authorization': 'Basic ' + base64.encode(App.credentials)
    };

  $.ajax(App.domain + App.serviceURL, options).done(onsuccess).fail(onerror);
}