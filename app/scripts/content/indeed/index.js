/*
 * Author:    Edward
 * Created:   Dec 10, 2016
 *
 * Component: Content Scripts
 *
 * (c) Copyright by Pomato
 **/

var IndeedPage = function() {

}

IndeedPage.prototype.isValidPage = function() {
  return true;
}

IndeedPage.prototype.extractResumeFile = function() {
	var element =  $('a#download_pdf_button');

	if (!element || !element.length || element.attr('href').startsWith('/')) {
		return '';
	}

	console.log('[Pomato Plugin Content Script] Resume Link:', element.attr('href'));

	return element.attr('href');
}