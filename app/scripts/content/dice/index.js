/*
 * Author:    Edward
 * Created:   Dec 07, 2016
 *
 * Component: Content Scripts
 *
 * (c) Copyright by Alltech
 **/

var DicePage = function() {}

DicePage.prototype.isValidPage = function() {
  return true;
}

DicePage.prototype.extractResumeFile = function() {
  var element = $('a.resume-download');

  if (!element || !element.length) {
    return '';
  }

  console.log('[Alltech Plugin Content Script] Resume Link:', element.attr('href'));

  return element.attr('href');
}

DicePage.prototype.extractResumeInfo = function() {
  return new Promise(function(resolve, reject) {
    var elemTalentProfileContainer = $('div.container.talent-profile');

    if (!elemTalentProfileContainer || !elemTalentProfileContainer.length)
      return reject('Profile Not Found');

    this.resume_info = {
      'fullname': '',
      'title': '',
      'current_location': '',
      'visa_status': '',
      'primary_email_address': '',
      'primary_phone_no': '',
      'secondary_email_addresses': '', //separated by comma
      'active_status': '', // 17 days ago
      'preferred_location': '',
      'hourly_rate': '',
      'salary': '',
      'employment_type': '',
      'resume_preview_header': ''
    };

    var elemFullname = $('div.profile-body #profile-page-info-name');
    if (elemFullname && elemFullname.length)
      this.resume_info.fullname = elemFullname[0].textContent.trim();

    var elemTitle = $('div.profile-body div.profile-data-card h2.currentOrLastTitle');
    if (elemTitle && elemTitle.length)
      this.resume_info.title = elemTitle[0].textContent.trim();

    var elemCurrentLocation = $('section#center-content div.profile-data-card div.card-body .location-for-display a');
    if (elemCurrentLocation && elemCurrentLocation.length)
      this.resume_info.current_location = elemCurrentLocation[0].textContent.trim();

    var elemWorkDocuments = $('section#center-content div.profile-data-card div.card-body span.work-permit-document');
    if (elemWorkDocuments && elemWorkDocuments.length)
      this.resume_info.visa_status = elemWorkDocuments[0].textContent.trim();

    var elemEmailAddresses = $('aside#right-sidebar div.profile-data-card div.card-body div.card-section-content li.email-icon div.media-body');
    if (elemEmailAddresses && elemEmailAddresses.length) {
      this.resume_info.primary_email_address = elemEmailAddresses[0].textContent.trim();

      for (var i = 1, len = elemEmailAddresses.length; i < len; i++) {
        if (!this.resume_info.secondary_email_addresses)
          this.resume_info.secondary_email_addresses = elemEmailAddresses[i].textContent.trim();
        else
          this.resume_info.secondary_email_addresses += ',' + elemEmailAddresses[i].textContent.trim();
      }
    }

    var elemPhoneNo = $('aside#right-sidebar div.profile-data-card div.card-body div.card-section-content li.phone-icon div.media-body');
    if (elemPhoneNo && elemPhoneNo.length) {
      this.resume_info.primary_phone_no = elemPhoneNo[0].textContent.trim();
    }

    var elemCandidateActivity = $('aside#right-sidebar div.profile-data-card.profile-activity div.card-body div.card-section-content ul.list-unstyled li:first-child div');
    if (elemCandidateActivity && elemCandidateActivity.length) {
      this.resume_info.active_status = elemCandidateActivity[0].textContent.trim();

      var pos = this.resume_info.active_status.indexOf('active');

      this.resume_info.active_status = this.resume_info.active_status.substr(pos + 7);
    }

    var elemPreferredLocation = $('#work-preferences .work-preferred-location');
    if (elemPreferredLocation && elemPreferredLocation.length) {
      this.resume_info.preferred_location = elemPreferredLocation[0].textContent.trim();
    }

    var elemHourlyRate = $('#work-preferences .work-hourly-rate');
    if (elemHourlyRate && elemHourlyRate.length) {
      this.resume_info.hourly_rate = elemHourlyRate[0].textContent.trim();
    }

    var elemSalary = $('#work-preferences .work-salary');
    if (elemSalary && elemSalary.length) {
      this.resume_info.salary = elemSalary[0].textContent.trim();
    }

    var elemEmploymentType = $('#work-preferences .work-employment-type');
    if (elemEmploymentType && elemEmploymentType.length) {
      this.resume_info.employment_type = elemEmploymentType[0].textContent.trim();
    }

    var elemResumeHeader = $('#resume .resume-header');
    var btnDownloadResume = $('#button-download-resume');
    if (elemResumeHeader && elemResumeHeader.length && btnDownloadResume && btnDownloadResume.length) {
      this.resume_info.resume_preview_header = elemResumeHeader[0].textContent.trim();
    }

    resolve(this.resume_info);
  });
}

DicePage.prototype.downloadResume = function() {
  return new Promise(async function(resolve, reject) {
    var btnDownloadResume = $('#button-download-resume');

    if (btnDownloadResume && btnDownloadResume.length) {
      btnDownloadResume.click();

      await new Promise(function(resolve) { setTimeout(resolve, 500) });

      var arrDropdownBtn = $('#dropdown-download-resume li a');
      if (arrDropdownBtn && arrDropdownBtn.length) {
        for (var i = 0, len = arrDropdownBtn.length; i < len; i++)
          if (!arrDropdownBtn[i].textContent.trim().toLowerCase().includes('pdf')) {
            arrDropdownBtn[i].click();

            return resolve(true);
          }
      }
    }

    resolve(false);
  });
}