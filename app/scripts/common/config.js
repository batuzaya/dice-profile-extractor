var App = App || {};

// App.domain = 'http://localhost:8080/';
App.domain = 'https://stage.pomato.com/';
// App.domain = 'https://app.pomato.com/';
App.serviceURL = 'race-service/jDsa12EWRE46WhdasEJW99Rhdiu6aLshdEWTu52sOai/raceservice/';
App.credentials = 'raceuser:Fw#e1r2tdgYD$vd!w';

//Actions for Runtime Messages
App.message_actions = {
  //Popup -> Background
  'GET_USER_DATA': 'GET_USER_DATA',
  'CLEAN_HISTORY': 'CLEAN_HISTORY',
  'FORCE_UPLOAD_RESUME': 'FORCE_UPLOAD_RESUME',

  //Background -> Popup
  'USER_DATA': 'USER_DATA',
  'RESUME_FILENAME': 'RESUME_FILENAME',
  'UPLOAD_RESULT': 'UPLOAD_RESULT',
  'RESUME_ALREADY_UPLOADED': 'RESUME_ALREADY_UPLOADED',

  //Popup -> ContentScript
  'EXTRACT_RESUME_REMOTEFILE': 'EXTRACT_RESUME_REMOTEFILE',

  //ContentScript -> Popup
  'RESUME_REMOTEFILE': 'RESUME_REMOTEFILE',

  'TEST': 'TEST'
};
