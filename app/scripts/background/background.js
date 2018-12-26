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

  /**
  this.readDownloadedResume({
    fullname: 'Chuck McDaniels'
  }, 20).then(function (data) {
    console.log('[Alltech Plugin Background] successfully read the downloaded resume.');
    chrome.runtime.sendMessage({ action: App.message_actions.RESUME_FILEPATH, data: data });

    // this.uploadResume({
    //   remoteUrl: remoteFileURL,
    //   filename: filename,
    //   blob: data
    // });
  }).catch(function (error) {
    console.error('[Alltech Plugin Background] failed to read downloaded resume.', error);
    chrome.runtime.sendMessage({ action: App.message_actions.RESUME_FILEPATH, data: null });
  });
  //*/

  // this.getUserData(2000);
};

Background.prototype.listenMessage = function(message, sender, sendResponse) {
  console.log('[Alltech Plugin Background] received a message.', message);

  switch (message.action) {
    case App.message_actions.GET_USER_DATA: //This is fired by Popup
      this.getUserData();
      break;
    case App.message_actions.CLEAN_HISTORY: //This is fired by Popup
      this.uploadHistory[this.userData.userId] = {};
      break;
    case App.message_actions.PROFILE_INFO: //This is fired by Content Script after extracting the profile info
      if (message.data && message.data.resume_preview_header)
        this.readDownloadedResume(message.data, 0).then(function(res) {
          if (res) {
            console.log('[Alltech Plugin Background] successfully read the downloaded resume.', res);
            chrome.runtime.sendMessage({ action: App.message_actions.RESUME_FILEPATH, data: res });
          }
        }).catch(function(error) {
          console.error('[Alltech Plugin Background] failed to read downloaded resume.', error);
          chrome.runtime.sendMessage({ action: App.message_actions.RESUME_FILEPATH, data: null });
        });
      break;
    case App.message_actions.FORCE_READ_RESUME: //This is fired by Popup to force the upload regardless of whether it was already uploaded before
      if (message.data && message.data.resume_preview_header)
        this.readDownloadedResume(message.data, 20, true).then(function(data) {
          console.log('[Alltech Plugin Background] successfully read the downloaded resume.');
          chrome.runtime.sendMessage({ action: App.message_actions.RESUME_FILEPATH, data: data });
        }).catch(function(error) {
          console.error('[Alltech Plugin Background] failed to read downloaded resume.', error);
          chrome.runtime.sendMessage({ action: App.message_actions.RESUME_FILEPATH, data: null });
        });
      break;
    case App.message_actions.UPLOAD_RESUME:
      if (message.data && message.data) {
        this.uploadResume({
          data: message.data,
          filename: message.filename,
          filepath: message.filepath
        });
      }
      break;
  }
};

Background.prototype.getUserData = function(interval) {
  console.log('[Alltech Plugin Background] is getting the User Data.');

  /**
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
      console.log('[Alltech Plugin Background] is sending back the User Data.', data);

      this.userData = data.userData;

      if (!this.uploadHistory[this.userData.userId])
        this.uploadHistory[this.userData.userId] = this.uploadHistory[this.userData.userId] || {};

      chrome.runtime.sendMessage({ action: App.message_actions.USER_DATA, data: data.userData, uploadHistory: this.uploadHistory[this.userData.userId] });
    } else {
      console.error('[Alltech Plugin Background] got the success response, but does not have the current User Data', data);
      chrome.runtime.sendMessage({ action: App.message_actions.USER_DATA, data: null });
    }
  }.bind(this)).fail(function(jqXHR, textStatus, errorThrown) {
    console.error('[Alltech Plugin Background] failed to get the current User Data', {
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
  //*/

  //**
  this.userData = {
    userName: 'dev',
    userId: 0
  };

  console.log('[Alltech Plugin Background] is sending back the Dev User Data.', this.userData);

  if (!this.uploadHistory[this.userData.userId])
    this.uploadHistory[this.userData.userId] = this.uploadHistory[this.userData.userId] || {};

  chrome.runtime.sendMessage({ action: App.message_actions.USER_DATA, data: this.userData, uploadHistory: this.uploadHistory[this.userData.userId] });
  //*/
};

// Once the Content Script clicks on the Download Button, the Backend evaluates if the resume has already been uploaded.
// If it's already uploaded before, it notifies the user.
// If the user confirms to upload again, bForce is set TRUE.
Background.prototype.readDownloadedResume = function(objProfileInfo, nTryOut, bForce) {
  var self = this;

  return new Promise(function(resolve, reject) {
    if (!objProfileInfo || !objProfileInfo.fullname)
      return reject('Invalid Profile Info');

    /*if (!bForce) {
      for (var user_id in this.uploadHistory) {
        for (var resume_id in this.uploadHistory[user_id]) {
          if (this.uploadHistory[user_id][resume_id].remoteUrl === remoteFileURL) {
            bContinueProcessing = false;
            console.log('[Alltech Plugin Background] found that the resume has been already uploaded');
            chrome.runtime.sendMessage({ action: App.message_actions.RESUME_ALREADY_DOWNLOADED });
            break;
          }
        }
      }
    }*/

    var query = {
      filenameRegex: 'Dice_Resume_CV_' + objProfileInfo.fullname.replace(/ /g, '_'),
      orderBy: ["-startTime"],
      limit: 1,
      state: 'complete'
    };

    console.log('[Alltech Plugin Background] is searching for the downloaded resume.', query);

    chrome.downloads.search(query, async function(items) {
      if (items && items.length) {
        console.log('[Alltech Plugin Background] found the downloaded resume.', items[0]);

        // if (!bForce) {
        //   chrome.runtime.sendMessage({ action: App.message_actions.RESUME_ALREADY_DOWNLOADED });
        //   return resolve(null);
        // }

        var pos = items[0].filename.indexOf('Dice_Resume_CV_');
        var filename = items[0].filename.substr(pos);

        resolve({
          filepath: 'file://' + items[0].filename,
          filename: filename
        });
      } else if (nTryOut) {
        console.log('[Alltech Plugin Background] is waiting for the downloaded resume.', nTryOut);

        await new Promise(function(resolve) { setTimeout(resolve, 1000) });

        self.readDownloadedResume(objProfileInfo, nTryOut - 1, bForce).then(resolve).catch(reject);
      } else if (bForce) {
        reject('Could not find downloaded resume.');
      } else {
        console.log('[Alltech Plugin Background] is requesting to donwload resume.', objProfileInfo);

        chrome.tabs.query({
          active: true,
          currentWindow: true
        }, function(tabs) {
          chrome.tabs.sendMessage(tabs[0].id, { action: App.message_actions.DOWNLOAD_RESUME, data: objProfileInfo });
        }.bind(this));
      }
    });
  });
};

Background.prototype.uploadResume = function(objUploadInfo) {
  console.log('[Alltech Plugin Background] is uploading the resume.', objUploadInfo);

  var that = this;

  /**
  $.ajax(objUploadInfo.filepath, {
    type: 'GET',
    dataType: 'binary',
    processData: false
  }).done(function(data, textStatus, jqXHR) {
      console.log("data", data);
    // data.lastModifiedDate = new Date();
    // data.name = objUploadInfo.filename;

    // var file = new File([data], objUploadInfo.filename);
    // console.log("file", file);
  }).fail(function(jqXHR, textStatus, errorThrown) {
    console.error('[Alltech Plugin Background] failed to read the file.', {
      textStatus: textStatus,
      errorThrown: errorThrown
    });
    chrome.runtime.sendMessage({ action: App.message_actions.UPLOAD_RESULT, success: false });
  });
  //*/

  //**
  getFileObject(objUploadInfo.filepath, objUploadInfo.filename, function(file) {
    fnUploadFile(objUploadInfo.data, file,
      function(data, textStatus, jqXHR) {
        if (textStatus === 'success' && data && data.status === 'success') {
          // that.uploadHistory[that.userData.userId][data.resumeId] = {
          //   filename: objUploadInfo.filename,
          //   uploadedAt: new Date().getTime()
          // };

          chrome.runtime.sendMessage({ action: App.message_actions.UPLOAD_RESULT, success: true, uploadHistory: that.uploadHistory[that.userData.userId] });
        } else {
          console.error('[Alltech Plugin Background] tried to upload the resume, but something went wrong', data);
          chrome.runtime.sendMessage({ action: App.message_actions.UPLOAD_RESULT, success: false });
        }
      },
      function(jqXHR, textStatus, errorThrown) {
        console.error('[Alltech Plugin Background] failed to upload the resume', {
          textStatus: textStatus,
          errorThrown: errorThrown
        });
        chrome.runtime.sendMessage({ action: App.message_actions.UPLOAD_RESULT, success: false });
      });
  });
  //*/

  // var data = {
  //   alltechSessionId: this.userData.alltechSessionId,
  //   userName: this.userData.userName,
  //   userId: this.userData.userId,
  //   userIP: this.userData.userIP,
  //   resumeFileNameWithExtn: objUploadInfo.filename,
  //   resumeFileURL: objUploadInfo.remoteUrl
  // };

  // objUploadInfo.blob.lastModifiedDate = new Date();
  // objUploadInfo.blob.name = objUploadInfo.filename;
};

// Once the Content Script passes the remote link of the resume to the Backend, the Backend evaluates if the resume has already been uploaded.
// If it's already uploaded before, it notifies the user.
// If the user confirms to upload again, bForce is set TRUE.
/**
Background.prototype.extractFilename = function(remoteFileURL, bForce) {
  if (!remoteFileURL || typeof remoteFileURL !== 'string')
    return;

  var bContinueProcessing = true;

  if (!bForce) {
    for (var user_id in this.uploadHistory) {
      for (var resume_id in this.uploadHistory[user_id]) {
        if (this.uploadHistory[user_id][resume_id].remoteUrl === remoteFileURL) {
          bContinueProcessing = false;
          console.log('[Alltech Plugin Background] found that the resume has been already uploaded');
          chrome.runtime.sendMessage({ action: App.message_actions.RESUME_ALREADY_DOWNLOADED });
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

        console.log('[Alltech Plugin Background] is sending back the Filename.', content_disposition);
        chrome.runtime.sendMessage({ action: App.message_actions.RESUME_FILEPATH, filename: filename });

        this.uploadResume({
          remoteUrl: remoteFileURL,
          filename: filename,
          blob: data
        });
      } else {
        console.error('[Alltech Plugin Background] got the success response, but could not extract the filename from the contentDisposi‌​tion:', content_disposition);
        chrome.runtime.sendMessage({ action: App.message_actions.RESUME_FILEPATH, data: null });
      }
    }.bind(this)).fail(function(jqXHR, textStatus, errorThrown) {
      console.error('[Alltech Plugin Background] failed to download the resume', {
        textStatus: textStatus,
        errorThrown: errorThrown
      });
      chrome.runtime.sendMessage({ action: App.message_actions.RESUME_FILEPATH, data: null });
    }.bind(this));
  }
};
//*/

setTimeout(function() {
  var app = new Background();
  app.run();
}, 2500);