'use strict';

chrome.runtime.onInstalled.addListener(function(details) {
  console.log('previousVersion', details.previousVersion);
});

chrome.tabs.onUpdated.addListener(function(tabId) {
  chrome.pageAction.show(tabId);
});

var Background = function() {
  this.userData = null;

  /**
  {
    *USER_ID*: {
      *RESUME_ID*: {
        filename: *FILENAME*,
        remoteUrl: *REMOTE_URL*,
        uploadedAt: *UPLOADED_AT*
      },
      *RESUME_ID*: {
        filename: *FILENAME*,
        remoteUrl: *REMOTE_URL*,
        uploadedAt: *UPLOADED_AT*
      }
      ...
    }
    ...
  }
  **/
  this.uploadHistory = {};
};

Background.prototype.run = function() {
  chrome.runtime.onMessage.addListener(this.listenMessage.bind(this));

  // this.getUserData(2000);
};

Background.prototype.listenMessage = function(message, sender, sendResponse) {
  console.log('[Pomato Plugin Background] received a message.', message);

  switch (message.action) {
    //This is fired by Popup
    case App.message_actions.GET_USER_DATA:
      this.getUserData();
      break;

      //This is fired by Popup
    case App.message_actions.CLEAN_HISTORY:
      this.uploadHistory[this.userData.userId] = {};
      break;

      //This is fired by Content Script with the remote URL of the resume
    case App.message_actions.RESUME_REMOTEFILE:
      if (message.data)
        this.extractFilename(message.data);
      break;

      //This is fired by Popup to force the upload regardless of whether it was already uploaded before
    case App.message_actions.FORCE_UPLOAD_RESUME:
      this.extractFilename(message.data, true);
      break;
  }
};

Background.prototype.getUserData = function(interval) {
  console.log('[Pomato Plugin Background] is getting the User Data.');

  var data = {
    userName: ''
  };

  $.ajax(App.domain + App.serviceURL + 'getUserData', {
    type: 'POST',
    data: $.param(data),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + base64.encode(App.credentials)
    }
  }).done(function(data, textStatus, jqXHR) {
    if (textStatus === 'success' && data && data.responseCode === 1) {
      console.log('[Pomato Plugin Background] is sending back the User Data.', data);

      this.userData = data.userData;

      if (!this.uploadHistory[this.userData.userId])
        this.uploadHistory[this.userData.userId] = this.uploadHistory[this.userData.userId] || {};

      chrome.runtime.sendMessage({ action: App.message_actions.USER_DATA, data: data.userData, uploadHistory: this.uploadHistory[this.userData.userId] });
    } else {
      console.error('[Pomato Plugin Background] got the success response, but does not have the current User Data', data);
      chrome.runtime.sendMessage({ action: App.message_actions.USER_DATA, data: null });
    }
  }.bind(this)).fail(function(jqXHR, textStatus, errorThrown) {
    console.error('[Pomato Plugin Background] failed to get the current User Data', {
      textStatus: textStatus,
      errorThrown: errorThrown
    });
    chrome.runtime.sendMessage({ action: App.message_actions.USER_DATA, data: null });
  }.bind(this)).always(function() {
    if (interval) {
      setTimeout(function() {
        this.getUserData(interval);
      }.bind(this), interval);
    }
  }.bind(this));
};

// Once the Content Script passes the remote link of the resume to the Backend, the Backend evaluates if the resume has already been uploaded.
// If it's already uploaded before, it notifies the user.
// If the user confirms to upload again, bForce is set TRUE.
Background.prototype.extractFilename = function(remoteFileURL, bForce) {
  var bContinueProcessing = true;

  if (!bForce) {
    for (var user_id in this.uploadHistory) {
      for (var resume_id in this.uploadHistory[user_id]) {
        if (this.uploadHistory[user_id][resume_id].remoteUrl === remoteFileURL) {
          bContinueProcessing = false;
          console.log('[Pomato Plugin Background] found that the resume has been already uploaded');
          chrome.runtime.sendMessage({ action: App.message_actions.RESUME_ALREADY_UPLOADED });
          break;
        }
      }
    }
  }

  if (bForce || bContinueProcessing) {
    $.ajax(remoteFileURL, {
      type: 'GET',
      dataType: 'binary',
      processData: false
    }).done(function(data, textStatus, jqXHR) {
      if (textStatus === 'success') {
        var content_disposition = jqXHR.getResponseHeader('Content-Disposition');
        var filename = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(content_disposition)[1];

        console.log('[Pomato Plugin Background] is sending back the Filename.', content_disposition);
        chrome.runtime.sendMessage({ action: App.message_actions.RESUME_FILENAME, filename: filename });

        this.uploadResume({
          remoteUrl: remoteFileURL,
          filename: filename,
          blob: data
        });
      } else {
        console.error('[Pomato Plugin Background] got the success response, but could not extract the filename from the contentDisposi‌​tion:', content_disposition);
        chrome.runtime.sendMessage({ action: App.message_actions.RESUME_FILENAME, data: null });
      }
    }.bind(this)).fail(function(jqXHR, textStatus, errorThrown) {
      console.error('[Pomato Plugin Background] failed to download the resume', {
        textStatus: textStatus,
        errorThrown: errorThrown
      });
      chrome.runtime.sendMessage({ action: App.message_actions.RESUME_FILENAME, data: null });
    }.bind(this));
  }
};

Background.prototype.uploadResume = function(uploadFileData) {
  console.log('[Pomato Plugin Background] is uploading the resume.', uploadFileData);

  // var getFileBlob = function(url, cb) {
  //   var xhr = new XMLHttpRequest();
  //   xhr.open('GET', url);
  //   xhr.responseType = 'blob';
  //   xhr.addEventListener('load', function() {
  //     cb(xhr.response);
  //   });
  //   xhr.send();
  // };

  // var blobToFile = function(blob, name) {
  //   blob.lastModifiedDate = new Date();
  //   blob.name = name;
  //   return blob;
  // };

  // var getFileObject = function(filePathOrUrl, cb) {
  //   getFileBlob(filePathOrUrl, function(blob) {
  //     cb(blobToFile(blob, 'test.jpg'));
  //   });
  // };

  // var data = {
  //   pomatoSessionId: this.userData.pomatoSessionId,
  //   userName: this.userData.userName,
  //   userId: this.userData.userId,
  //   userIP: this.userData.userIP,
  //   resumeFileNameWithExtn: uploadFileData.filename,
  //   resumeFileURL: uploadFileData.remoteUrl
  // };

  // $.ajax(App.domain + App.serviceURL + 'processResumeURL', {
  //   type: 'POST',
  //   data: $.param(data),
  //   headers: {
  //     'Content-Type': 'application/x-www-form-urlencoded',
  //     'Authorization': 'Basic ' + base64.encode(App.credentials)
  //   }
  // }).done(function(data, textStatus, jqXHR) {
  //   if (textStatus === 'success' && data && data.responseCode === 1) {
  //     this.uploadHistory[this.userData.userId][data.resumeId] = {
  //       filename: uploadFileData.filename,
  //       remoteUrl: uploadFileData.remoteUrl,
  //       uploadedAt: new Date().getTime()
  //     };

  //     console.log('[Pomato Plugin Background] is sending back the Upload Result.', data);
  //     chrome.runtime.sendMessage({ action: App.message_actions.UPLOAD_RESULT, success: true, resumeId: data.resumeId, uploadHistory: this.uploadHistory[this.userData.userId] });
  //   } else {
  //     console.error('[Pomato Plugin Background] got the success response, but does not have the ResumeID', data);
  //     chrome.runtime.sendMessage({ action: App.message_actions.UPLOAD_RESULT, success: false, resumeId: null });
  //   }
  // }.bind(this)).fail(function(jqXHR, textStatus, errorThrown) {
  //   console.error('[Pomato Plugin Background] failed to upload the resume', {
  //     textStatus: textStatus,
  //     errorThrown: errorThrown
  //   });
  //   chrome.runtime.sendMessage({ action: App.message_actions.UPLOAD_RESULT, success: false });
  // }.bind(this));

  uploadFileData.blob.lastModifiedDate = new Date();
  uploadFileData.blob.name = uploadFileData.filename;

  var file = new File([uploadFileData.blob], uploadFileData.filename);
  var that = this;

  fnUploadFile('uploadResume', file, null,
    function(data, textStatus, jqXHR) {
      if (textStatus === 'success' && data && data.responseCode === 1) {
        console.log('[Pomato Plugin Background] successfully uploaded the file. Now processing the file', data);

        fnUploadFile('processResume', file, data.resumeId,
          function(data, textStatus, jqXHR) {
            if (textStatus === 'success' && data && data.responseCode === 1) {
              that.uploadHistory[that.userData.userId][data.resumeId] = {
                filename: uploadFileData.filename,
                remoteUrl: uploadFileData.remoteUrl,
                uploadedAt: new Date().getTime()
              };

              console.log('[Pomato Plugin Background] successfully processed the file.', data);
              chrome.runtime.sendMessage({ action: App.message_actions.UPLOAD_RESULT, success: true, resumeId: data.resumeId, uploadHistory: that.uploadHistory[that.userData.userId] });
            } else {
              console.error('[Pomato Plugin Background] got the success response, but does not have the ResumeID', data);
              chrome.runtime.sendMessage({ action: App.message_actions.UPLOAD_RESULT, success: false, resumeId: null });
            }
          },
          function(jqXHR, textStatus, errorThrown) {
            console.error('[Pomato Plugin Background] failed to upload the resume', {
              textStatus: textStatus,
              errorThrown: errorThrown
            });
            chrome.runtime.sendMessage({ action: App.message_actions.UPLOAD_RESULT, success: false });
          });

      } else {
        console.error('[Pomato Plugin Background] got the success response, but something went wrong', data);
        chrome.runtime.sendMessage({ action: App.message_actions.UPLOAD_RESULT, success: false});
      }

    },
    function(jqXHR, textStatus, errorThrown) {
      console.error('[Pomato Plugin Background] failed to upload the resume', {
        textStatus: textStatus,
        errorThrown: errorThrown
      });
      chrome.runtime.sendMessage({ action: App.message_actions.UPLOAD_RESULT, success: false });
    });

  function fnUploadFile(url, file, resumeId, onsuccess, onerror) {
    var fd = new FormData();

    fd.append('pomatoSessionId', that.userData.pomatoSessionId);
    fd.append('userName', that.userData.userName);
    fd.append('userId', that.userData.userId);
    fd.append('userIP', that.userData.userIP);
    fd.append('resumeId', resumeId ? resumeId : '');
    fd.append('resumefile', file);

    $.ajax(App.domain + App.serviceURL + url, {
      type: 'POST',
      data: fd,
      dataType: 'json',
      cache: false,
      headers: {
        'Authorization': 'Basic ' + base64.encode(App.credentials)
      },
      processData: false,
      contentType: false
    }).done(onsuccess).fail(onerror);
  }
};

setTimeout(function() {
  var app = new Background();
  app.run();
}, 2500);
