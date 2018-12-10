/*
 * Author:    Edward
 * Created:   Dec 07, 2016
 *
 * Component: Content Scripts
 *
 * (c) Copyright by Pomato
 **/

var DicePage = function() {

}

DicePage.prototype.isValidPage = function() {
  return true;
}

DicePage.prototype.extractResumeFile = function() {
	var element =  $('a.resume-download');

	if (!element || !element.length) {
		return '';
	}

	console.log('[Pomato Plugin Content Script] Resume Link:', element.attr('href'));

	return element.attr('href');
}